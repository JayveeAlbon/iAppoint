<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentReminderNotification extends Notification
{
    use Queueable;

    /**
     * @param  Appointment  $appointment
     * @param  string       $type  '24h' or '1h'
     */
    public function __construct(
        public readonly Appointment $appointment,
        public readonly string $type = '24h',
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'event'          => 'appointment.reminder',
            'type'           => $this->type,
            'appointment_id' => $this->appointment->id,
            'title'          => $this->appointment->title,
            'requested_at'   => $this->appointment->requested_at?->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a    = $this->appointment->loadMissing(['student', 'faculty']);
        $when = optional($a->requested_at)->format('D, M j Y — g:i A');

        $isStudent = $notifiable->id === $a->student_id;
        $other     = $isStudent ? ($a->faculty?->name ?? 'your faculty') : ($a->student?->name ?? 'your student');
        $otherRole = $isStudent ? 'Faculty' : 'Student';

        $timeLabel = $this->type === '1h' ? 'in 1 hour' : 'tomorrow';
        $subject   = $this->type === '1h'
            ? "[iAppoint] Reminder: Your appointment is in 1 hour"
            : "[iAppoint] Reminder: Your appointment is tomorrow";

        return (new MailMessage)
            ->subject($subject)
            ->greeting("Hi {$notifiable->name},")
            ->line("This is a friendly reminder that you have an appointment **{$timeLabel}**.")
            ->line("**Subject:** {$a->title}")
            ->line("**{$otherRole}:** {$other}")
            ->line("**Scheduled for:** {$when}")
            ->action('View Appointment', url('/appointments'))
            ->line('Please be on time. If you need to cancel, do so as soon as possible.');
    }
}
