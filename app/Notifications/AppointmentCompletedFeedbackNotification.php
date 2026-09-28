<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentCompletedFeedbackNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a = $this->appointment->loadMissing(['faculty']);
        $facultyName = $a->faculty->name ?? 'your faculty';

        return (new MailMessage)
            ->subject('[iAppoint] How was your appointment? Please rate it')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your appointment with **{$facultyName}** has just been completed.")
            ->line("We'd love to hear how it went — please take a moment to rate the session. Your feedback helps faculty improve and keeps iAppoint useful for everyone.")
            ->action('Leave Feedback', url('/appointments'))
            ->line('Thank you!');
    }
}
