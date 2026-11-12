<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRescheduledNotification extends Notification
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
            'event'          => 'appointment.rescheduled',
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'requested_at'   => $a->requested_at?->toIso8601String(),
            'admin_notes'    => $a->admin_notes,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a = $this->appointment->loadMissing(['student', 'faculty']);
        $when = optional($a->requested_at)->format('D, M j Y — g:i A');
        $isStudent = $notifiable->id === $a->student_id;
        $other = $isStudent ? ($a->faculty?->name ?? 'your faculty') : ($a->student?->name ?? 'your student');
        $otherRole = $isStudent ? 'Faculty' : 'Student';

        return (new MailMessage)
            ->subject('[iAppoint] Your appointment has been rescheduled')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your appointment has been rescheduled by the administrator.")
            ->line("**Subject:** {$a->title}")
            ->line("**{$otherRole}:** {$other}")
            ->line("**New Schedule:** {$when}")
            ->when($a->admin_notes, fn($m) => $m->line("**Admin Note:** {$a->admin_notes}"))
            ->action('View Appointment', url('/appointments'))
            ->line('Please take note of the new schedule.');
    }
}
