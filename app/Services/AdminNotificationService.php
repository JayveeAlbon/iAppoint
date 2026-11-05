<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\UserRegisteredInAppNotification;

class AdminNotificationService
{
    public function userRegistered(User $user): void
    {
        User::query()
            ->where('role', 'admin')
            ->where('status', 'active')
            ->whereKeyNot($user->id)
            ->each(fn (User $admin) => $admin->notify(new UserRegisteredInAppNotification($user)));
    }
}
