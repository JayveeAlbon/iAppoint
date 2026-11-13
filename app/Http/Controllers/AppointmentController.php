<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentRequestedNotification;
use App\Notifications\AppointmentRequestedForFacultyNotification;
use App\Notifications\AppointmentRejectedByFacultyNotification;
use App\Notifications\AppointmentRescheduledByFacultyNotification;
use App\Notifications\AppointmentCancelledNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->isFaculty()) {
            $appointments = Appointment::where('faculty_id', $user->id)
                ->with(['student:id,name,avatar,course,year_level', 'feedback'])
                ->orderByDesc('requested_at')
                ->get();

            return Inertia::render('Appointments/Index', [
                'appointments' => $appointments,
                'faculty'      => [],
                'viewAs'       => 'faculty',
            ]);
        }

        $appointments = Appointment::where('student_id', $user->id)
            ->with(['faculty:id,name,avatar,department', 'feedback'])
            ->orderByDesc('created_at')
            ->get();

        $faculty = User::where('role', 'faculty')
            ->whereIn('status', ['active', 'pending'])
            ->select('id', 'name', 'department', 'avatar', 'status')
            ->with(['schedules' => fn($q) => $q
                ->orderByRaw("CASE day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END")
                ->orderBy('start_time')
                ->select('id', 'user_id', 'day', 'start_time', 'end_time', 'subject', 'room')
            ])
            ->orderBy('name')
            ->get()
            ->map(fn($f) => array_merge($f->toArray(), ['avatar_url' => $f->avatar_url]));

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
            'faculty'      => $faculty,
            'viewAs'       => 'student',
        ]);
    }

    /**
     * JSON — returns booked datetimes for a faculty in a given year+month.
     * Used by the calendar booking UI to grey out taken slots.
     */
    public function availability(Request $request, User $faculty): JsonResponse
    {
        abort_if($faculty->role !== 'faculty', 404);

        $year  = (int) $request->query('year',  now()->year);
        $month = (int) $request->query('month', now()->month);

        // All pending or approved appointments for this faculty in the requested month
        $booked = Appointment::where('faculty_id', $faculty->id)
            ->whereIn('status', ['pending', 'approved'])
            ->whereYear('requested_at', $year)
            ->whereMonth('requested_at', $month)
            ->pluck('requested_at')
            ->map(fn($dt) => $dt->setTimezone(config('app.timezone'))->format('Y-m-d H:i'))
            ->values();

        return response()->json(['booked' => $booked]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user->isStudent(), 403);

        $data = $request->validate([
            'faculty_id'   => [
                'required',
                Rule::exists('users', 'id')
                    ->where('role', 'faculty')
                    ->whereIn('status', ['active', 'pending']),
            ],
            'title'        => 'required|string|max:200',
            'message'      => 'nullable|string|max:1000',
            'requested_at' => 'required|date|after:now',
        ]);

        // Server-side duplicate-booking check: same faculty, same datetime, not rejected
        $conflict = Appointment::where('faculty_id', $data['faculty_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->where('requested_at', $data['requested_at'])
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'requested_at' => 'This time slot is already booked for the selected faculty. Please choose another time.',
            ])->withInput();
        }

        $data['student_id'] = $user->id;
        $appointment = Appointment::create($data);

        // Notify admins — wrapped so SMTP failures never crash the request
        try {
            $this->notifyAdmins($appointment);
        } catch (\Throwable $e) {
            Log::warning('Admin notification failed on appointment request: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
                'exception'      => $e,
            ]);
        }

        // Notify the faculty — in-app (database) + email
        $appointment->loadMissing(['faculty']);

        if ($appointment->faculty) {
            $appointment->faculty->notify(
                new AppointmentRequestedForFacultyNotification($appointment, ['database'])
            );
        }

        try {
            if ($appointment->faculty?->email) {
                $appointment->faculty->notify(
                    new AppointmentRequestedForFacultyNotification($appointment, ['mail'])
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Faculty request email failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
                'exception'      => $e,
            ]);
        }

        return back()->with('success', 'Appointment request submitted. Awaiting admin approval.');
    }

    private function notifyAdmins(Appointment $appointment, bool $isCancellation = false): void
    {
        $recipients = User::where('role', 'admin')
            ->where('status', 'active')
            ->whereNotNull('email')
            ->get();

        $notification = $isCancellation
            ? new AppointmentCancelledNotification($appointment, ['mail'])
            : new AppointmentRequestedNotification($appointment);

        $configured = config('services.admin_notify_email') ?: env('ADMIN_NOTIFY_EMAIL');
        if ($configured) {
            Notification::route('mail', $configured)->notify($notification);
        }

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, $notification);
        }
    }

    public function facultyApprove(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user->isFaculty(), 403);
        abort_if($appointment->faculty_id !== $user->id, 403);
        abort_if($appointment->status !== 'pending', 422);

        $appointment->update([
            'status'      => 'approved',
            'approved_at' => now(),
        ]);

        $appointment->loadMissing(['student', 'faculty']);

        // In-app notification for student
        if ($appointment->student) {
            $appointment->student->notify(
                new \App\Notifications\AppointmentApprovedForStudentNotification($appointment, ['database'])
            );
        }

        // Email notification for student
        try {
            if ($appointment->student?->email) {
                $appointment->student->notify(
                    new \App\Notifications\AppointmentApprovedForStudentNotification($appointment, ['mail'])
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Faculty approve email failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
                'exception'      => $e,
            ]);
        }

        return back()->with('success', 'Appointment approved. The student has been notified.');
    }

    public function facultyReject(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user->isFaculty(), 403);
        abort_if($appointment->faculty_id !== $user->id, 403);
        abort_if(!in_array($appointment->status, ['pending', 'approved']), 422);

        $data = $request->validate([
            'faculty_notes' => 'nullable|string|max:500',
        ]);

        $appointment->update([
            'status'      => 'rejected',
            'admin_notes' => $data['faculty_notes'] ?? null,
        ]);

        $appointment->loadMissing(['student', 'faculty']);

        // In-app notification for student
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentRejectedByFacultyNotification($appointment, ['database'])
            );
        }

        // Email notification for student
        try {
            if ($appointment->student?->email) {
                $appointment->student->notify(
                    new AppointmentRejectedByFacultyNotification($appointment, ['mail'])
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Faculty reject email failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
                'exception'      => $e,
            ]);
        }

        return back()->with('success', 'Appointment declined. The student has been notified.');
    }

    public function facultyReschedule(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user->isFaculty(), 403);
        abort_if($appointment->faculty_id !== $user->id, 403);
        abort_if(!in_array($appointment->status, ['pending', 'approved']), 422);

        $data = $request->validate([
            'requested_at'  => 'required|date|after:now',
            'faculty_notes' => 'nullable|string|max:500',
        ]);

        $appointment->update([
            'requested_at' => $data['requested_at'],
            'admin_notes'  => $data['faculty_notes'] ?? $appointment->admin_notes,
        ]);

        $appointment->loadMissing(['student', 'faculty']);

        // In-app notification for student
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentRescheduledByFacultyNotification($appointment, ['database'])
            );
        }

        // Email notification for student
        try {
            if ($appointment->student?->email) {
                $appointment->student->notify(
                    new AppointmentRescheduledByFacultyNotification($appointment, ['mail'])
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Faculty reschedule email failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
                'exception'      => $e,
            ]);
        }

        return back()->with('success', 'Appointment rescheduled. The student has been notified.');
    }

    public function destroy(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->student_id !== $request->user()->id, 403);
        abort_if($appointment->status === 'approved', 422);

        // Load relationships before deleting so we can notify
        $appointment->loadMissing(['student', 'faculty']);
        $facultyUser = $appointment->faculty;

        $appointment->delete();

        // Notify faculty — in-app + email
        if ($facultyUser) {
            try {
                $facultyUser->notify(new AppointmentCancelledNotification($appointment, ['database']));
            } catch (\Throwable $e) {
                Log::warning('Cancellation in-app notification failed for faculty: ' . $e->getMessage());
            }
            try {
                if ($facultyUser->email) {
                    $facultyUser->notify(new AppointmentCancelledNotification($appointment, ['mail']));
                }
            } catch (\Throwable $e) {
                Log::warning('Cancellation email failed for faculty: ' . $e->getMessage(), [
                    'appointment_id' => $appointment->id,
                    'exception'      => $e,
                ]);
            }
        }

        // Notify admins — email only
        try {
            $this->notifyAdmins($appointment, isCancellation: true);
        } catch (\Throwable $e) {
            Log::warning('Cancellation admin notification failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
                'exception'      => $e,
            ]);
        }

        return back()->with('success', 'Appointment request cancelled.');
    }
}
