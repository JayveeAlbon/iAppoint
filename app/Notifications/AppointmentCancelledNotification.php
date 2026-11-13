<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentCancelledNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Appointment $appointment,
        private array $channels = ['database', 'mail'],
    ) {}

    public function via(object $notifiable): array
    {
        return $this->channels;
    }

    public function toArray(object $notifiable): array
    {
        $a = $this->appointment->loadMissing(['student', 'faculty']);

        return [
            'event'          => 'appointment.cancelled',
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'student_name'   => $a->student?->name,
            'faculty_name'   => $a->faculty?->name,
            'requested_at'   => $a->requested_at?->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a    = $this->appointment->loadMissing(['student', 'faculty']);
        $when = optional($a->requested_at)->format('D, M j Y \a\t g:i A');

        return (new MailMessage)
            ->subject('Appointment Cancelled — ' . $a->title)
            ->greeting("Hello {$notifiable->name},")
            ->line('An appointment request has been cancelled by the student.')
            ->line("**Subject:** {$a->title}")
            ->line("**Student:** " . ($a->student?->name ?? '—'))
            ->line("**Faculty:** " . ($a->faculty?->name ?? '—'))
            ->line("**Was scheduled for:** {$when}")
            ->action('View Appointments', url('/appointments'))
            ->line('This is an automated notification from the iAppoint system.');
    }
}
