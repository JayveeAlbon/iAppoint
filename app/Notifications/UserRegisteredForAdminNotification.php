<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserRegisteredForAdminNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly User $user) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[iAppoint] New account awaiting approval')
            ->greeting('Hello Administrator,')
            ->line("A new user has just signed up and is waiting for you to review their account.")
            ->line("**Name:** {$this->user->name}")
            ->line("**Email:** {$this->user->email}")
            ->line("**Role:** " . ucfirst($this->user->role))
            ->action('Review Pending Users', url('/admin/users?status=pending'))
            ->line('Please approve or reject this account so the user can start using iAppoint.');
    }
}
