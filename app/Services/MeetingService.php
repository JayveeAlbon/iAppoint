<?php

namespace App\Services;

use App\Models\CateringSession;
use App\Models\Meeting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MeetingService
{
    public function __construct(
        private readonly FacultyStatusService $statusService,
    ) {}

    public function create(User $faculty, array $data, array $participantIds): Meeting
    {
        return DB::transaction(function () use ($faculty, $data, $participantIds) {
            $meeting = Meeting::create([
                'created_by'       => $faculty->id,
                'title'            => $data['title'],
                'scheduled_at'     => $data['scheduled_at'],
                'duration_minutes' => $data['duration_minutes'] ?? 60,
                'status'           => 'scheduled',
                'room_code'        => Str::random(10),
            ]);

            $ids = array_unique(array_diff($participantIds, [$faculty->id]));
            $meeting->participants()->attach($ids, ['status' => 'invited']);

            return $meeting;
        });
    }

    public function start(Meeting $meeting): void
    {
        DB::transaction(function () use ($meeting) {
            $meeting->update(['status' => 'ongoing']);

            $faculty = $meeting->creator;

            // Create catering sessions for all accepted participants
            $accepted = $meeting->participants()
                ->wherePivot('status', 'accepted')
                ->get();

            foreach ($accepted as $participant) {
                CateringSession::create([
                    'faculty_id' => $faculty->id,
                    'student_id' => $participant->id,
                    'meeting_id' => $meeting->id,
                    'started_at' => now(),
                ]);
            }

            $this->statusService->refresh($faculty);
        });
    }

    public function end(Meeting $meeting): void
    {
        DB::transaction(function () use ($meeting) {
            $meeting->update(['status' => 'completed']);

            CateringSession::where('meeting_id', $meeting->id)
                ->whereNull('ended_at')
                ->update(['ended_at' => now()]);

            $this->statusService->refresh($meeting->creator);
        });
    }

    public function cancel(Meeting $meeting): void
    {
        $meeting->update(['status' => 'cancelled']);
    }

    public function respond(Meeting $meeting, User $user, string $response): void
    {
        $meeting->participants()->updateExistingPivot($user->id, [
            'status' => $response,
        ]);
    }
}
