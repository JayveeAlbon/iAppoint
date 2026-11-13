<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the STUDENT when a faculty member invites them to an appointment.
 */
class AppointmentInvitedNotification extends Notification
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
            'event'          => 'appointment.invited',
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'faculty_name'   => $a->faculty?->name,
            'requested_at'   => $a->requested_at?->toIso8601String(),
            'message'        => $a->message,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a    = $this->appointment->loadMissing(['faculty']);
        $when = optional($a->requested_at)->format('D, M j Y \a\t g:i A');

        $facultyLabel = $a->faculty?->name ?? '—';
        if ($a->faculty?->department) {
            $facultyLabel .= " ({$a->faculty->department})";
        }

        $facultyName = $a->faculty?->name ?? 'a Faculty Member';

        $mail = (new MailMessage)
            ->subject("You Have a New Appointment Invitation from {$facultyName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("A faculty member has sent you an appointment invitation.")
            ->line("**Faculty:** {$facultyLabel}")
            ->line("**Subject:** {$a->title}")
            ->line("**Proposed Date & Time:** {$when}")
            ->line("**Status:** INVITED — Awaiting your response");

        if ($a->message) {
            $mail->line("**Message from Faculty:** {$a->message}");
        }

        return $mail
            ->action('View & Respond to Invitation', url('/appointments'))
            ->line('Please log in to accept or decline this appointment invitation.')
            ->line('This is an automated notification from the iAppoint system.');
    }
}
