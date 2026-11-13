<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentRequestedNotification;
use App\Notifications\AppointmentRequestedForFacultyNotification;
use App\Notifications\AppointmentApprovedForStudentNotification;
use App\Notifications\AppointmentInvitedNotification;
use App\Notifications\AppointmentInviteResponseNotification;
use App\Notifications\AppointmentRejectedByFacultyNotification;
use App\Notifications\AppointmentRescheduledByFacultyNotification;
use App\Notifications\AppointmentCancelledNotification;
use App\Services\NotificationLogService;
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
    public function __construct(private readonly NotificationLogService $logger) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->isFaculty()) {
            $appointments = Appointment::where('faculty_id', $user->id)
                ->with(['student:id,name,avatar,course,year_level', 'feedback'])
                ->orderByDesc('requested_at')
                ->get();

            // Active students for the invite modal
            $students = User::where('role', 'student')
                ->where('status', 'active')
                ->select('id', 'name', 'student_id', 'course', 'year_level', 'avatar')
                ->orderBy('name')
                ->get()
                ->map(fn($s) => array_merge($s->toArray(), ['avatar_url' => $s->avatar_url]));

            return Inertia::render('Appointments/Index', [
                'appointments' => $appointments,
                'faculty'      => [],
                'students'     => $students,
                'viewAs'       => 'faculty',
            ]);
        }

        // Student view — include invited appointments too
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
            'students'     => [],
            'viewAs'       => 'student',
        ]);
    }

    /**
     * JSON — returns booked datetimes for a faculty in a given year+month.
     */
    public function availability(Request $request, User $faculty): JsonResponse
    {
        abort_if($faculty->role !== 'faculty', 404);

        $year  = (int) $request->query('year',  now()->year);
        $month = (int) $request->query('month', now()->month);

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

        // Duplicate-booking check
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
        $appointment->loadMissing(['faculty']);

        // ── Notify admins ─────────────────────────────────────────────────────
        $this->notifyAdmins($appointment);

        // ── Notify faculty (in-app first, then logged email) ─────────────────
        if ($appointment->faculty) {
            // In-app (database channel — not logged, always fires)
            $appointment->faculty->notify(
                new AppointmentRequestedForFacultyNotification($appointment, ['database'])
            );

            // Email (logged)
            if ($appointment->faculty->email) {
                $this->logger->send(
                    $appointment->faculty,
                    new AppointmentRequestedForFacultyNotification($appointment, ['mail']),
                    'appointment.requested.faculty',
                    $appointment,
                );
            }
        }

        return back()->with('success', 'Appointment request submitted. Awaiting admin approval.');
    }

    private function notifyAdmins(Appointment $appointment, bool $isCancellation = false): void
    {
        $recipients = User::where('role', 'admin')
            ->where('status', 'active')
            ->whereNotNull('email')
            ->get();

        $type         = $isCancellation ? 'appointment.cancelled.admin' : 'appointment.requested';
        $notification = $isCancellation
            ? new AppointmentCancelledNotification($appointment, ['mail'])
            : new AppointmentRequestedNotification($appointment);

        $configured = config('services.admin_notify_email') ?: env('ADMIN_NOTIFY_EMAIL');
        if ($configured) {
            // Configured address may not be a User — log manually
            try {
                Notification::route('mail', $configured)->notify($notification);
            } catch (\Throwable $e) {
                Log::warning("Admin configured-email failed [{$type}]: " . $e->getMessage());
            }
        }

        foreach ($recipients as $admin) {
            if ($admin->email) {
                $this->logger->send($admin, $notification, $type, $appointment);
            }
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

        // In-app
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentApprovedForStudentNotification($appointment, ['database'])
            );
        }

        // Email (logged)
        if ($appointment->student?->email) {
            $this->logger->send(
                $appointment->student,
                new AppointmentApprovedForStudentNotification($appointment, ['mail']),
                'appointment.approved.student',
                $appointment,
            );
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

        // In-app
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentRejectedByFacultyNotification($appointment, ['database'])
            );
        }

        // Email (logged)
        if ($appointment->student?->email) {
            $this->logger->send(
                $appointment->student,
                new AppointmentRejectedByFacultyNotification($appointment, ['mail']),
                'appointment.rejected.faculty',
                $appointment,
            );
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

        // In-app
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentRescheduledByFacultyNotification($appointment, ['database'])
            );
        }

        // Email (logged)
        if ($appointment->student?->email) {
            $this->logger->send(
                $appointment->student,
                new AppointmentRescheduledByFacultyNotification($appointment, ['mail']),
                'appointment.rescheduled.faculty',
                $appointment,
            );
        }

        return back()->with('success', 'Appointment rescheduled. The student has been notified.');
    }

    /**
     * Faculty invites a student to an appointment.
     */
    public function facultyInvite(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user->isFaculty(), 403);

        $data = $request->validate([
            'student_id'   => [
                'required',
                Rule::exists('users', 'id')
                    ->where('role', 'student')
                    ->where('status', 'active'),
            ],
            'title'        => 'required|string|max:200',
            'message'      => 'nullable|string|max:1000',
            'requested_at' => 'required|date|after:now',
        ]);

        // Duplicate-booking check (same slot already pending/approved/invited)
        $conflict = Appointment::where('faculty_id', $user->id)
            ->whereIn('status', ['pending', 'approved', 'invited'])
            ->where('requested_at', $data['requested_at'])
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'requested_at' => 'This time slot is already reserved. Please choose a different time.',
            ])->withInput();
        }

        $appointment = Appointment::create([
            'faculty_id'   => $user->id,
            'student_id'   => $data['student_id'],
            'initiated_by' => $user->id,
            'title'        => $data['title'],
            'message'      => $data['message'] ?? null,
            'requested_at' => $data['requested_at'],
            'status'       => 'invited',
        ]);

        $appointment->loadMissing(['student', 'faculty']);

        // ── In-app notification ───────────────────────────────────────────────
        if ($appointment->student) {
            $appointment->student->notify(
                new AppointmentInvitedNotification($appointment, ['database'])
            );
        }

        // ── Email notification (logged) ───────────────────────────────────────
        if ($appointment->student?->email) {
            $this->logger->send(
                $appointment->student,
                new AppointmentInvitedNotification($appointment, ['mail']),
                'appointment.invited',
                $appointment,
            );
        }

        return back()->with('success', 'Invitation sent. The student has been notified.');
    }

    /**
     * Student accepts a faculty invitation → status becomes pending (awaits admin).
     */
    public function studentAccept(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user->isStudent(), 403);
        abort_if($appointment->student_id !== $user->id, 403);
        abort_if($appointment->status !== 'invited', 422);

        $appointment->update(['status' => 'pending']);
        $appointment->loadMissing(['student', 'faculty']);

        // ── Notify faculty in-app ─────────────────────────────────────────────
        if ($appointment->faculty) {
            $appointment->faculty->notify(
                new AppointmentInviteResponseNotification($appointment, 'accepted', ['database'])
            );
        }

        // ── Notify faculty email (logged) ─────────────────────────────────────
        if ($appointment->faculty?->email) {
            $this->logger->send(
                $appointment->faculty,
                new AppointmentInviteResponseNotification($appointment, 'accepted', ['mail']),
                'appointment.invite.accepted',
                $appointment,
            );
        }

        // ── Notify admins (email, logged) ─────────────────────────────────────
        $this->notifyAdmins($appointment);

        return back()->with('success', 'You accepted the invitation. The appointment is now awaiting admin approval.');
    }

    /**
     * Student declines a faculty invitation → status becomes declined.
     */
    public function studentDecline(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user->isStudent(), 403);
        abort_if($appointment->student_id !== $user->id, 403);
        abort_if($appointment->status !== 'invited', 422);

        $appointment->update(['status' => 'declined']);
        $appointment->loadMissing(['student', 'faculty']);

        // ── Notify faculty in-app ─────────────────────────────────────────────
        if ($appointment->faculty) {
            $appointment->faculty->notify(
                new AppointmentInviteResponseNotification($appointment, 'declined', ['database'])
            );
        }

        // ── Notify faculty email (logged) ─────────────────────────────────────
        if ($appointment->faculty?->email) {
            $this->logger->send(
                $appointment->faculty,
                new AppointmentInviteResponseNotification($appointment, 'declined', ['mail']),
                'appointment.invite.declined',
                $appointment,
            );
        }

        return back()->with('success', 'You declined the invitation. The faculty has been notified.');
    }

    public function destroy(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->student_id !== $request->user()->id, 403);
        // Allow cancelling: pending, invited, or declined (not approved)
        abort_if($appointment->status === 'approved', 422);

        $appointment->loadMissing(['student', 'faculty']);
        $facultyUser = $appointment->faculty;

        $appointment->delete();

        // Notify faculty (in-app + logged email)
        if ($facultyUser) {
            try {
                $facultyUser->notify(new AppointmentCancelledNotification($appointment, ['database']));
            } catch (\Throwable $e) {
                Log::warning('Cancellation in-app notification failed: ' . $e->getMessage());
            }

            if ($facultyUser->email) {
                $this->logger->send(
                    $facultyUser,
                    new AppointmentCancelledNotification($appointment, ['mail']),
                    'appointment.cancelled.faculty',
                    $appointment,
                );
            }
        }

        // Notify admins (logged email)
        $this->notifyAdmins($appointment, isCancellation: true);

        return back()->with('success', 'Appointment request cancelled.');
    }
}
