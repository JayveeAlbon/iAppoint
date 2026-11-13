<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRejectedByFacultyNotification extends Notification
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
        $a = $this->appointment->loadMissing(['faculty']);

        return [
            'event'          => 'appointment.rejected_by_faculty',
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'faculty_name'   => $a->faculty?->name,
            'faculty_notes'  => $a->admin_notes,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a    = $this->appointment->loadMissing(['faculty']);
        $when = optional($a->requested_at)->format('D, M j Y — g:i A');

        $mail = (new MailMessage)
            ->subject('[iAppoint] Your appointment was declined by the faculty — ' . $a->title)
            ->greeting("Hi {$notifiable->name},")
            ->line("Unfortunately, the faculty has declined your appointment request.")
            ->line("**Subject:** " . $a->title)
            ->line("**Faculty:** " . ($a->faculty?->name ?? '—'))
            ->line("**Requested for:** {$when}");

        if ($a->admin_notes) {
            $mail->line("**Reason:** {$a->admin_notes}");
        }

        return $mail
            ->action('View My Appointments', url('/appointments'))
            ->line('You may submit a new request at a different time.');
    }
}
