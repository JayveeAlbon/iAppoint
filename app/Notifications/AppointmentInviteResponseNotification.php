<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the FACULTY when a student accepts or declines an invitation.
 */
class AppointmentInviteResponseNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Appointment $appointment,
        private readonly string     $response,  // 'accepted' or 'declined'
        private array               $channels = ['database', 'mail'],
    ) {}

    public function via(object $notifiable): array
    {
        return $this->channels;
    }

    public function toArray(object $notifiable): array
    {
        $a = $this->appointment->loadMissing(['student']);

        return [
            'event'          => "appointment.invite.{$this->response}",
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'student_name'   => $a->student?->name,
            'response'       => $this->response,
            'requested_at'   => $a->requested_at?->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a    = $this->appointment->loadMissing(['student']);
        $when = optional($a->requested_at)->format('D, M j Y \a\t g:i A');

        $studentLabel = $a->student?->name ?? '—';
        if ($a->student?->course || $a->student?->year_level) {
            $studentLabel .= ' (' . trim(($a->student->course ?? '') . ' ' . ($a->student->year_level ?? '')) . ')';
        }

        $studentName = $a->student?->name ?? 'Student';
        $isAccepted  = $this->response === 'accepted';
        $statusLine  = $isAccepted ? '**ACCEPTED** ✓' : '**DECLINED** ✗';

        return (new MailMessage)
            ->subject($isAccepted
                ? "Appointment Invitation Accepted by {$studentName}"
                : "Appointment Invitation Declined by {$studentName}")
            ->greeting("Hello {$notifiable->name},")
            ->line($isAccepted
                ? "A student has accepted your appointment invitation."
                : "A student has declined your appointment invitation.")
            ->line("**Subject:** {$a->title}")
            ->line("**Student:** {$studentLabel}")
            ->line("**Proposed Date & Time:** {$when}")
            ->line("**Response:** {$statusLine}")
            ->action('View My Appointments', url('/appointments'))
            ->line($isAccepted
                ? 'The appointment is now confirmed and awaiting admin approval.'
                : 'The time slot has been released and is available for other bookings.')
            ->line('This is an automated notification from the iAppoint system.');
    }
}
