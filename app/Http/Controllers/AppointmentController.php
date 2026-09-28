<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentRequestedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ->where('status', 'active')
            ->select('id', 'name', 'department', 'avatar')
            ->orderBy('name')
            ->get()
            ->map(fn($f) => array_merge($f->toArray(), ['avatar_url' => $f->avatar_url]));

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
            'faculty'      => $faculty,
            'viewAs'       => 'student',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user->isStudent(), 403);

        $data = $request->validate([
            'faculty_id'   => ['required', Rule::exists('users', 'id')->where('role', 'faculty')->where('status', 'active')],
            'title'        => 'required|string|max:200',
            'message'      => 'nullable|string|max:1000',
            'requested_at' => 'required|date|after:now',
        ]);

        $data['student_id'] = $user->id;
        $appointment = Appointment::create($data);

        $this->notifyAdmins($appointment);

        return back()->with('success', 'Appointment request submitted. Awaiting admin approval.');
    }

    private function notifyAdmins(Appointment $appointment): void
    {
        $recipients = User::where('role', 'admin')
            ->where('status', 'active')
            ->whereNotNull('email')
            ->get();

        $configured = config('services.admin_notify_email') ?: env('ADMIN_NOTIFY_EMAIL');
        if ($configured) {
            Notification::route('mail', $configured)
                ->notify(new AppointmentRequestedNotification($appointment));
        }

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new AppointmentRequestedNotification($appointment));
        }
    }

    public function destroy(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->student_id !== $request->user()->id, 403);
        abort_if($appointment->status === 'approved', 422);

        $appointment->delete();

        return back()->with('success', 'Appointment request cancelled.');
    }
}
