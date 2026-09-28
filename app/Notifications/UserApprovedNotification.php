<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserApprovedNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[iAppoint] Your account has been approved')
            ->greeting("Hello {$notifiable->name},")
            ->line('Good news — an administrator has approved your iAppoint account.')
            ->line('You can now sign in and start booking appointments, messaging faculty, and using the campus features.')
            ->action('Sign In to iAppoint', url('/'))
            ->line('Welcome aboard!');
    }
}
