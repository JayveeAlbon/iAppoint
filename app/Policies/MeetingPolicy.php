<?php

namespace App\Policies;

use App\Models\Meeting;
use App\Models\User;

class MeetingPolicy
{
    public function view(User $user, Meeting $meeting): bool
    {
        return $meeting->created_by === $user->id
            || $meeting->participants()->where('user_id', $user->id)->exists();
    }

    public function manage(User $user, Meeting $meeting): bool
    {
        return $meeting->created_by === $user->id;
    }

    public function respond(User $user, Meeting $meeting): bool
    {
        return $meeting->participants()->where('user_id', $user->id)->exists();
    }
}
