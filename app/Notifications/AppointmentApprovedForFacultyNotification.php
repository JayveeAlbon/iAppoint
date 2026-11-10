<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentApprovedForFacultyNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray(object $notifiable): array
    {
        $a = $this->appointment->loadMissing(['student']);

        return [
            'event'          => 'appointment.approved',
            'appointment_id' => $a->id,
            'title'          => $a->title,
            'student_name'   => $a->student?->name,
            'requested_at'   => $a->requested_at?->toIso8601String(),
            'admin_notes'    => $a->admin_notes,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a = $this->appointment->loadMissing(['student']);
        $when = optional($a->requested_at)->format('D, M j Y — g:i A');

        $studentLabel = $a->student->name ?? '—';
        if ($a->student?->course || $a->student?->year_level) {
            $studentLabel .= ' (' . trim(($a->student->course ?? '') . ' ' . ($a->student->year_level ?? '')) . ')';
        }

        return (new MailMessage)
            ->subject('[iAppoint] New confirmed appointment with a student')
            ->greeting("Hello {$notifiable->name},")
            ->line('An appointment involving you has been approved by the administrator.')
            ->line("**Subject:** {$a->title}")
            ->line("**With student:** {$studentLabel}")
            ->line("**Scheduled for:** {$when}")
            ->when($a->message, fn ($m) => $m->line("**Student's message:** " . $a->message))
            ->action('View My Appointments', url('/appointments'))
            ->line('Please prepare accordingly.');
    }
}
