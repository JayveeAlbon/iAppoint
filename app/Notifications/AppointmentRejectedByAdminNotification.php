<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRejectedByAdminNotification extends Notification
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
            'event'          => 'appointment.rejected_by_admin',
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'admin_notes'    => $a->admin_notes,
            'requested_at'   => $a->requested_at?->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a    = $this->appointment->loadMissing(['student', 'faculty']);
        $when = optional($a->requested_at)->format('D, M j Y \a\t g:i A');

        // Determine if notifiable is student or faculty to customise message
        $isStudent = $notifiable->id === $a->student_id;

        $mail = (new MailMessage)
            ->subject('Your Appointment Request Has Been Rejected — ' . $a->title)
            ->greeting("Hello {$notifiable->name},");

        if ($isStudent) {
            $mail->line('We regret to inform you that your appointment request has been rejected by the administrator.')
                 ->line("**Subject:** {$a->title}")
                 ->line("**Faculty:** " . ($a->faculty?->name ?? '—'))
                 ->line("**Requested Date & Time:** {$when}");
        } else {
            $mail->line('An appointment request involving you has been rejected by the administrator.')
                 ->line("**Subject:** {$a->title}")
                 ->line("**Student:** " . ($a->student?->name ?? '—'))
                 ->line("**Requested Date & Time:** {$when}");
        }

        if ($a->admin_notes) {
            $mail->line("**Reason:** {$a->admin_notes}");
        }

        return $mail
            ->action('View My Appointments', url('/appointments'))
            ->line('This is an automated notification from the iAppoint system.');
    }
}
