<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRescheduledByFacultyNotification extends Notification
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
            'event'          => 'appointment.rescheduled_by_faculty',
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'faculty_name'   => $a->faculty?->name,
            'requested_at'   => $a->requested_at?->toIso8601String(),
            'faculty_notes'  => $a->admin_notes,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a    = $this->appointment->loadMissing(['faculty']);
        $when = optional($a->requested_at)->format('D, M j Y — g:i A');

        $mail = (new MailMessage)
            ->subject('[iAppoint] Your appointment has been rescheduled by the faculty — ' . $a->title)
            ->greeting("Hi {$notifiable->name},")
            ->line("The faculty has proposed a new schedule for your appointment.")
            ->line("**Subject:** " . $a->title)
            ->line("**Faculty:** " . ($a->faculty?->name ?? '—'))
            ->line("**New Schedule:** {$when}");

        if ($a->admin_notes) {
            $mail->line("**Note from faculty:** {$a->admin_notes}");
        }

        return $mail
            ->action('View My Appointments', url('/appointments'))
            ->line('Please check your appointments page for the updated details.');
    }
}
