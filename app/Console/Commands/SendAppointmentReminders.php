<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Notifications\AppointmentReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendAppointmentReminders extends Command
{
    protected $signature   = 'appointments:send-reminders';
    protected $description = 'Send 24-hour and 1-hour email reminders for upcoming approved appointments';

    public function handle(): int
    {
        $now = now();

        // ── 24-hour reminders ─────────────────────────────────────────────────
        // Window: appointments happening between 23h and 25h from now
        $appointments24h = Appointment::where('status', 'approved')
            ->whereNull('reminder_24h_sent_at')
            ->whereBetween('requested_at', [
                $now->copy()->addHours(23),
                $now->copy()->addHours(25),
            ])
            ->with(['student', 'faculty'])
            ->get();

        foreach ($appointments24h as $appointment) {
            $this->sendReminder($appointment, '24h');
        }

        // ── 1-hour reminders ──────────────────────────────────────────────────
        // Window: appointments happening between 45 minutes and 75 minutes from now
        $appointments1h = Appointment::where('status', 'approved')
            ->whereNull('reminder_1h_sent_at')
            ->whereBetween('requested_at', [
                $now->copy()->addMinutes(45),
                $now->copy()->addMinutes(75),
            ])
            ->with(['student', 'faculty'])
            ->get();

        foreach ($appointments1h as $appointment) {
            $this->sendReminder($appointment, '1h');
        }

        $total = $appointments24h->count() + $appointments1h->count();
        $this->info("Sent reminders for {$total} appointment(s).");

        return self::SUCCESS;
    }

    private function sendReminder(Appointment $appointment, string $type): void
    {
        $column = $type === '1h' ? 'reminder_1h_sent_at' : 'reminder_24h_sent_at';

        try {
            // Notify student
            if ($appointment->student?->email) {
                $appointment->student->notify(
                    new AppointmentReminderNotification($appointment, $type)
                );
            }

            // Notify faculty
            if ($appointment->faculty?->email) {
                $appointment->faculty->notify(
                    new AppointmentReminderNotification($appointment, $type)
                );
            }

            // Mark as sent so we don't resend
            $appointment->update([$column => now()]);

            $this->line("  [{$type}] Appointment #{$appointment->id} — {$appointment->title}");

        } catch (\Throwable $e) {
            Log::error("Reminder send failed for appointment #{$appointment->id}: " . $e->getMessage());
            $this->error("  Failed for appointment #{$appointment->id}: " . $e->getMessage());
        }
    }
}
