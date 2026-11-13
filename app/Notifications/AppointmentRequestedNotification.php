<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRequestedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a = $this->appointment->loadMissing(['student', 'faculty']);
        $when = optional($a->requested_at)->format('D, M j Y — g:i A');

        return (new MailMessage)
            ->subject('New Appointment Request — ' . ($a->title) . ' (' . ($a->student->name ?? '—') . ')')
            ->greeting('Hello Administrator,')
            ->line("A new appointment request has been submitted and needs your review.")
            ->line("**Student:** " . ($a->student->name ?? '—') . ($a->student?->email ? " ({$a->student->email})" : ''))
            ->line("**Faculty:** " . ($a->faculty->name ?? '—'))
            ->line("**Subject:** {$a->title}")
            ->line("**Preferred Date & Time:** {$when}")
            ->line("**Status:** PENDING")
            ->when($a->message, fn ($m) => $m->line('**Message from student:** ' . $a->message))
            ->action('Review Appointment', url('/admin/appointments'))
            ->line('Please review and act on this request as soon as possible.')
            ->line('This is an automated notification from the iAppoint system.');
    }
}
