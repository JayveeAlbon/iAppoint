<?php

namespace App\Policies;

use App\Models\Friendship;
use App\Models\User;

class FriendshipPolicy
{
    public function respond(User $user, Friendship $friendship): bool
    {
        return $user->id === $friendship->addressee_id
            && $friendship->status === 'pending';
    }

    public function delete(User $user, Friendship $friendship): bool
    {
        return $user->id === $friendship->requester_id
            || $user->id === $friendship->addressee_id;
    }
}
