<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRequestedForFacultyNotification extends Notification
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
        $a = $this->appointment->loadMissing(['student']);

        return [
            'event'          => 'appointment.requested',
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'student_name'   => $a->student?->name,
            'requested_at'   => $a->requested_at?->toIso8601String(),
            'message'        => $a->message,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a    = $this->appointment->loadMissing(['student']);
        $when = optional($a->requested_at)->format('D, M j Y — g:i A');

        $studentLabel = $a->student->name ?? '—';
        if ($a->student?->course || $a->student?->year_level) {
            $studentLabel .= ' (' . trim(($a->student->course ?? '') . ' ' . ($a->student->year_level ?? '')) . ')';
        }

        $mail = (new MailMessage)
            ->subject('[iAppoint] New appointment request from a student — ' . $a->title)
            ->greeting("Hello {$notifiable->name},")
            ->line('A student has requested an appointment with you.')
            ->line("**Subject:** {$a->title}")
            ->line("**Student:** {$studentLabel}")
            ->line("**Preferred date:** {$when}");

        if ($a->message) {
            $mail->line("**Student's message:** {$a->message}");
        }

        return $mail
            ->action('View My Appointments', url('/appointments'))
            ->line('You can approve, decline, or propose a new schedule from your appointments page.');
    }
}
