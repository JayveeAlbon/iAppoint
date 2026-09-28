<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CateringSession;
use App\Models\FacultyStatus;
use App\Models\User;
use App\Notifications\AppointmentCompletedFeedbackNotification;
use Illuminate\Support\Facades\Log;

class FacultyStatusService
{
    public function refresh(User $faculty): FacultyStatus
    {
        $count = CateringSession::where('faculty_id', $faculty->id)
            ->whereNull('ended_at')
            ->count();

        return FacultyStatus::updateOrCreate(
            ['user_id' => $faculty->id],
            [
                'status'         => $count > 0 ? 'busy' : 'available',
                'catering_count' => $count,
            ]
        );
    }

    public function startSession(User $faculty, User $student): CateringSession
    {
        $session = CateringSession::create([
            'faculty_id' => $faculty->id,
            'student_id' => $student->id,
            'started_at' => now(),
        ]);

        $this->refresh($faculty);

        return $session;
    }

    public function endSession(CateringSession $session): void
    {
        $session->update(['ended_at' => now()]);

        $appointment = Appointment::where('faculty_id', $session->faculty_id)
            ->where('student_id', $session->student_id)
            ->where('status', 'approved')
            ->latest()
            ->first();

        if ($appointment) {
            $appointment->update(['status' => 'completed']);
            $this->notifyStudentForFeedback($appointment);
        }

        $this->refresh(User::find($session->faculty_id));
    }

    public function activeSessions(User $faculty): \Illuminate\Database\Eloquent\Collection
    {
        return CateringSession::where('faculty_id', $faculty->id)
            ->whereNull('ended_at')
            ->with('student:id,name,role,course,year_level')
            ->orderBy('started_at')
            ->get();
    }

    public function clearAll(User $faculty): void
    {
        $sessions = CateringSession::where('faculty_id', $faculty->id)
            ->whereNull('ended_at')
            ->get();

        foreach ($sessions as $session) {
            $session->update(['ended_at' => now()]);

            $appointment = Appointment::where('faculty_id', $session->faculty_id)
                ->where('student_id', $session->student_id)
                ->where('status', 'approved')
                ->latest()
                ->first();

            if ($appointment) {
                $appointment->update(['status' => 'completed']);
                $this->notifyStudentForFeedback($appointment);
            }
        }

        $this->refresh($faculty);
    }

    private function notifyStudentForFeedback(Appointment $appointment): void
    {
        try {
            $student = $appointment->student;
            if ($student?->email) {
                $student->notify(new AppointmentCompletedFeedbackNotification($appointment));
            }
        } catch (\Throwable $e) {
            Log::warning('Feedback request mail failed: ' . $e->getMessage(), [
                'appointment_id' => $appointment->id,
            ]);
        }
    }
}
