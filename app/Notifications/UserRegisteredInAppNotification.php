<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class UserRegisteredInAppNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly User $registeredUser) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'event' => 'user.registered',
            'user_id' => $this->registeredUser->id,
            'name' => $this->registeredUser->name,
            'email' => $this->registeredUser->email,
            'role' => $this->registeredUser->role,
        ];
    }
}
