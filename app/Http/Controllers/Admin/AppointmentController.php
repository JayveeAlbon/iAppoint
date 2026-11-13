<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Notifications\AppointmentApprovedForFacultyNotification;
use App\Notifications\AppointmentApprovedForStudentNotification;
use App\Notifications\AppointmentRejectedByAdminNotification;
use App\Notifications\AppointmentRescheduledNotification;
use App\Services\AuditLogService;
use App\Services\NotificationLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function __construct(
        private readonly AuditLogService       $audit,
        private readonly NotificationLogService $logger,
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status', 'pending');

        $appointments = Appointment::with([
            'student:id,name,avatar,course,year_level',
            'faculty:id,name,avatar,department',
        ])
        ->when($status !== 'all', fn($q) => $q->where('status', $status))
        ->orderByDesc('created_at')
        ->paginate(20)
        ->withQueryString();

        $counts = [
            'pending'   => Appointment::where('status', 'pending')->count(),
            'approved'  => Appointment::where('status', 'approved')->count(),
            'rejected'  => Appointment::where('status', 'rejected')->count(),
            'completed' => Appointment::where('status', 'completed')->count(),
        ];

        return Inertia::render('Admin/Appointments/Index', [
            'appointments' => $appointments,
            'counts'       => $counts,
            'filters'      => ['status' => $status],
        ]);
    }

    public function approve(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->status !== 'pending', 422);

        $data = $request->validate([
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $appointment->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'admin_notes' => $data['admin_notes'] ?? null,
        ]);

        $this->audit->log('appointment.approved', $appointment, [
            'student' => $appointment->student->name ?? null,
            'faculty' => $appointment->faculty->name ?? null,
        ]);

        $appointment->loadMissing(['student', 'faculty']);

        // ── 1. In-app notifications (database channel — not logged) ───────────
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentApprovedForStudentNotification($appointment, ['database'])
            );
        }
        if ($appointment->faculty) {
            $appointment->faculty->notify(
                new AppointmentApprovedForFacultyNotification($appointment, ['database'])
            );
        }

        // ── 2. Email (logged via NotificationLogService) ──────────────────────
        if ($appointment->student?->email) {
            $this->logger->send(
                $appointment->student,
                new AppointmentApprovedForStudentNotification($appointment, ['mail']),
                'appointment.approved.student',
                $appointment,
            );
        }

        if ($appointment->faculty?->email) {
            $this->logger->send(
                $appointment->faculty,
                new AppointmentApprovedForFacultyNotification($appointment, ['mail']),
                'appointment.approved.faculty',
                $appointment,
            );
        }

        return back()->with('success', 'Appointment approved. Notifications sent to student and faculty.');
    }

    public function reject(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->status !== 'pending', 422);

        $data = $request->validate([
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $appointment->update([
            'status'      => 'rejected',
            'admin_notes' => $data['admin_notes'] ?? null,
        ]);

        $this->audit->log('appointment.rejected', $appointment, [
            'student' => $appointment->student->name ?? null,
            'faculty' => $appointment->faculty->name ?? null,
        ]);

        $appointment->loadMissing(['student', 'faculty']);

        // ── 1. In-app ─────────────────────────────────────────────────────────
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentRejectedByAdminNotification($appointment, ['database'])
            );
        }
        if ($appointment->faculty) {
            $appointment->faculty->notify(
                new AppointmentRejectedByAdminNotification($appointment, ['database'])
            );
        }

        // ── 2. Email (logged) ─────────────────────────────────────────────────
        if ($appointment->student?->email) {
            $this->logger->send(
                $appointment->student,
                new AppointmentRejectedByAdminNotification($appointment, ['mail']),
                'appointment.rejected.admin',
                $appointment,
            );
        }

        if ($appointment->faculty?->email) {
            $this->logger->send(
                $appointment->faculty,
                new AppointmentRejectedByAdminNotification($appointment, ['mail']),
                'appointment.rejected.admin',
                $appointment,
            );
        }

        return back()->with('success', 'Appointment rejected. Student and faculty have been notified.');
    }

    public function reschedule(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if(!in_array($appointment->status, ['pending', 'approved']), 422);

        $data = $request->validate([
            'requested_at' => 'required|date|after:now',
            'admin_notes'  => 'nullable|string|max:500',
        ]);

        $appointment->update([
            'requested_at' => $data['requested_at'],
            'admin_notes'  => $data['admin_notes'] ?? $appointment->admin_notes,
        ]);

        $this->audit->log('appointment.rescheduled', $appointment, [
            'student'      => $appointment->student->name ?? null,
            'faculty'      => $appointment->faculty->name ?? null,
            'new_schedule' => $data['requested_at'],
        ]);

        $appointment->loadMissing(['student', 'faculty']);

        // ── 1. In-app ─────────────────────────────────────────────────────────
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentRescheduledNotification($appointment, ['database'])
            );
        }
        if ($appointment->faculty) {
            $appointment->faculty->notify(
                new AppointmentRescheduledNotification($appointment, ['database'])
            );
        }

        // ── 2. Email (logged) ─────────────────────────────────────────────────
        if ($appointment->student?->email) {
            $this->logger->send(
                $appointment->student,
                new AppointmentRescheduledNotification($appointment, ['mail']),
                'appointment.rescheduled',
                $appointment,
            );
        }

        if ($appointment->faculty?->email) {
            $this->logger->send(
                $appointment->faculty,
                new AppointmentRescheduledNotification($appointment, ['mail']),
                'appointment.rescheduled',
                $appointment,
            );
        }

        return back()->with('success', 'Appointment rescheduled. Student and faculty have been notified.');
    }
}
