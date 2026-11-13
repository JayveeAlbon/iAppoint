<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\NotificationLog;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class NotificationLogService
{
    /**
     * Send a mail notification and record the result in notification_logs.
     *
     * @param  User              $recipient   The User to notify
     * @param  Notification      $notification A notification class with ['mail'] channel
     * @param  string            $type        Dot-notation type key e.g. 'appointment.approved.student'
     * @param  Appointment|null  $appointment Related appointment (nullable)
     * @return NotificationLog
     */
    public function send(
        User        $recipient,
        Notification $notification,
        string       $type,
        ?Appointment $appointment = null,
    ): NotificationLog {

        // Build a preview of the email subject + first lines (no credentials)
        $subject = $this->extractSubject($notification, $recipient);
        $preview = $this->buildPreview($notification, $recipient);

        // Create log entry as PENDING first
        $log = NotificationLog::create([
            'appointment_id'   => $appointment?->id,
            'recipient_user_id'=> $recipient->id,
            'recipient_name'   => $recipient->name,
            'recipient_email'  => $recipient->email,
            'notification_type'=> $type,
            'email_subject'    => $subject,
            'email_preview'    => $preview,
            'status'           => 'pending',
        ]);

        // Attempt sending
        try {
            $recipient->notify($notification);

            $log->update([
                'status'  => 'sent',
                'sent_at' => now(),
            ]);
        } catch (Throwable $e) {
            $log->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            Log::warning("Notification email failed [{$type}]: " . $e->getMessage(), [
                'log_id'         => $log->id,
                'appointment_id' => $appointment?->id,
                'recipient_id'   => $recipient->id,
            ]);
        }

        return $log;
    }

    /**
     * Retry a failed log entry — sends the same type of notification again.
     * Reuses the original appointment / recipient relationship.
     */
    public function retry(NotificationLog $log): NotificationLog
    {
        abort_if($log->status !== 'failed', 422, 'Only failed notifications can be retried.');

        $recipient = $log->recipient;
        abort_if(!$recipient, 422, 'Recipient user no longer exists.');

        $appointment = $log->appointment;

        // Rebuild the right notification class from the type key
        $notification = $this->buildNotification($log->notification_type, $appointment);
        abort_if(!$notification, 422, 'Cannot reconstruct notification for this type.');

        $log->update(['status' => 'pending', 'error_message' => null]);

        try {
            $recipient->notify($notification);

            $log->update([
                'status'  => 'sent',
                'sent_at' => now(),
            ]);
        } catch (Throwable $e) {
            $log->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            Log::warning("Retry failed [{$log->notification_type}]: " . $e->getMessage(), [
                'log_id' => $log->id,
            ]);
        }

        return $log->fresh();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function extractSubject(Notification $notification, User $recipient): string
    {
        try {
            if (method_exists($notification, 'toMail')) {
                $mail = $notification->toMail($recipient);
                return $mail->subject ?? '(no subject)';
            }
        } catch (Throwable) {}
        return '(unknown subject)';
    }

    private function buildPreview(Notification $notification, User $recipient): string
    {
        try {
            if (method_exists($notification, 'toMail')) {
                $mail = $notification->toMail($recipient);
                $lines = collect($mail->introLines ?? [])->implode(' | ');
                return mb_substr($lines, 0, 500);
            }
        } catch (Throwable) {}
        return '';
    }

    private function buildNotification(string $type, ?Appointment $appointment): ?Notification
    {
        if (!$appointment) return null;

        return match ($type) {
            'appointment.requested'           => new \App\Notifications\AppointmentRequestedNotification($appointment),
            'appointment.requested.faculty'   => new \App\Notifications\AppointmentRequestedForFacultyNotification($appointment, ['mail']),
            'appointment.approved.student'    => new \App\Notifications\AppointmentApprovedForStudentNotification($appointment, ['mail']),
            'appointment.approved.faculty'    => new \App\Notifications\AppointmentApprovedForFacultyNotification($appointment, ['mail']),
            'appointment.rejected.admin'      => new \App\Notifications\AppointmentRejectedByAdminNotification($appointment, ['mail']),
            'appointment.rejected.faculty'    => new \App\Notifications\AppointmentRejectedByFacultyNotification($appointment, ['mail']),
            'appointment.rescheduled'         => new \App\Notifications\AppointmentRescheduledNotification($appointment, ['mail']),
            'appointment.rescheduled.faculty' => new \App\Notifications\AppointmentRescheduledByFacultyNotification($appointment, ['mail']),
            'appointment.cancelled.faculty'   => new \App\Notifications\AppointmentCancelledNotification($appointment, ['mail']),
            'appointment.cancelled.admin'     => new \App\Notifications\AppointmentCancelledNotification($appointment, ['mail']),
            default => null,
        };
    }
}
