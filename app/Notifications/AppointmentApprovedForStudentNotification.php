<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentApprovedForStudentNotification extends Notification
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
        $appointment = $this->appointment->loadMissing('faculty');

        return [
            'event' => 'appointment.approved',
            'appointment_id' => $appointment->id,
            'title' => $appointment->title,
            'faculty_name' => $appointment->faculty?->name,
            'requested_at' => $appointment->requested_at?->toIso8601String(),
            'admin_notes' => $appointment->admin_notes,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a = $this->appointment->loadMissing(['faculty']);
        $when = optional($a->requested_at)->format('D, M j Y — g:i A');

        $mail = (new MailMessage)
            ->subject('Your Appointment Request Has Been Approved — ' . $a->title)
            ->greeting("Hi {$notifiable->name},")
            ->line("Great news! Your appointment request has been approved by the administrator.")
            ->line("**Subject:** {$a->title}")
            ->line("**Faculty:** " . ($a->faculty->name ?? '—')
                . ($a->faculty->department ? " ({$a->faculty->department})" : ''))
            ->line("**Scheduled Date & Time:** {$when}")
            ->line("**Status:** APPROVED");

        if ($a->admin_notes) {
            $mail->line("**Note from admin:** {$a->admin_notes}");
        }

        return $mail
            ->action('View My Appointments', url('/appointments'))
            ->line('Please arrive on time. Contact the faculty via Messages if you need to adjust anything.')
            ->line('This is an automated notification from the iAppoint system.');
    }
}
