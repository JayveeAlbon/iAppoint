<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Notifications\AppointmentApprovedForFacultyNotification;
use App\Notifications\AppointmentApprovedForStudentNotification;
use App\Notifications\AppointmentRescheduledNotification;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function __construct(private readonly AuditLogService $audit) {}

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

        Log::info('[approve] Starting notifications', [
            'appointment_id' => $appointment->id,
            'student_id'     => $appointment->student?->id,
            'student_email'  => $appointment->student?->email,
            'faculty_id'     => $appointment->faculty?->id,
            'faculty_email'  => $appointment->faculty?->email,
        ]);

        // ── 1. Store in-app (database) notifications — always first, no mail ─
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

        // ── 2. Send email — wrapped so failure never blocks in-app notif ──────
        try {
            if ($appointment->student?->email) {
                Log::info('[approve] Sending student approval email to ' . $appointment->student->email);
                $appointment->student->notify(
                    new AppointmentApprovedForStudentNotification($appointment, ['mail'])
                );
                Log::info('[approve] Student approval email sent successfully');
            } else {
                Log::warning('[approve] Student has no email — skipping mail', ['student_id' => $appointment->student?->id]);
            }
        } catch (\Throwable $e) {
            Log::warning('Approval email failed for student: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
                'student_id'     => $appointment->student?->id,
                'exception'      => $e,
            ]);
        }

        try {
            if ($appointment->faculty?->email) {
                Log::info('[approve] Sending faculty approval email to ' . $appointment->faculty->email);
                $appointment->faculty->notify(
                    new AppointmentApprovedForFacultyNotification($appointment, ['mail'])
                );
                Log::info('[approve] Faculty approval email sent successfully');
            } else {
                Log::warning('[approve] Faculty has no email — skipping mail', ['faculty_id' => $appointment->faculty?->id]);
            }
        } catch (\Throwable $e) {
            Log::warning('Approval email failed for faculty: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
                'faculty_id'     => $appointment->faculty?->id,
                'exception'      => $e,
            ]);
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

        return back()->with('success', 'Appointment rejected.');
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

        // Database notifications
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

        // Email notifications
        try {
            if ($appointment->student?->email) {
                $appointment->student->notify(
                    new AppointmentRescheduledNotification($appointment, ['mail'])
                );
            }
            if ($appointment->faculty?->email) {
                $appointment->faculty->notify(
                    new AppointmentRescheduledNotification($appointment, ['mail'])
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Reschedule email failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
            ]);
        }

        return back()->with('success', 'Appointment rescheduled. Student and faculty have been notified.');
    }
}
