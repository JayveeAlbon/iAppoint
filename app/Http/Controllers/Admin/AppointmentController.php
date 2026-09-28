<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Notifications\AppointmentApprovedForFacultyNotification;
use App\Notifications\AppointmentApprovedForStudentNotification;
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

        $this->notifyApproval($appointment);

        return back()->with('success', 'Appointment approved. Notifications sent to student and faculty.');
    }

    private function notifyApproval(Appointment $appointment): void
    {
        $appointment->loadMissing(['student', 'faculty']);

        try {
            if ($appointment->student?->email) {
                $appointment->student->notify(new AppointmentApprovedForStudentNotification($appointment));
            }
            if ($appointment->faculty?->email) {
                $appointment->faculty->notify(new AppointmentApprovedForFacultyNotification($appointment));
            }
        } catch (\Throwable $e) {
            // Never let mail failures break the admin flow — log and continue.
            Log::warning('appointment approval mail failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
            ]);
        }
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
}
