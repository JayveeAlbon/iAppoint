<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentApprovedForFacultyNotification;
use App\Notifications\AppointmentApprovedForStudentNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

        // Auto-approve: create appointment as approved immediately
        $data['student_id'] = $user->id;
        $data['status']     = 'approved';
        $data['approved_at'] = now();

        $appointment = Appointment::create($data);

        // Notify both student and faculty immediately
        $this->notifyApproval($appointment);

        return back()->with('success', 'Appointment confirmed! A notification has been sent to you and the faculty.');
    }

    private function notifyApproval(Appointment $appointment): void
    {
        $appointment->loadMissing(['student', 'faculty']);

        try {
            if ($appointment->student?->email) {
                $appointment->student->notify(
                    new AppointmentApprovedForStudentNotification($appointment)
                );
            }
            if ($appointment->faculty?->email) {
                $appointment->faculty->notify(
                    new AppointmentApprovedForFacultyNotification($appointment)
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Appointment notification failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
            ]);
        }
    }

    public function destroy(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->student_id !== $request->user()->id, 403);
        abort_if($appointment->status === 'completed', 422);

        $appointment->delete();

        return back()->with('success', 'Appointment cancelled.');
    }
}
