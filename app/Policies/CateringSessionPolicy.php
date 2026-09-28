<?php

namespace App\Policies;

use App\Models\CateringSession;
use App\Models\User;

class CateringSessionPolicy
{
    public function end(User $user, CateringSession $session): bool
    {
        return $user->id === $session->faculty_id;
    }
}
