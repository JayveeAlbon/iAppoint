<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\NotificationLog;
use App\Models\UserFeedback;
use App\Notifications\AppointmentApprovedForFacultyNotification;
use App\Notifications\AppointmentApprovedForStudentNotification;
use App\Notifications\AppointmentInvitedNotification;
use App\Notifications\AppointmentInviteResponseNotification;
use App\Notifications\AppointmentRejectedByAdminNotification;
use App\Notifications\AppointmentRejectedByFacultyNotification;
use App\Notifications\AppointmentReminderNotification;
use App\Notifications\AppointmentRequestedForFacultyNotification;
use App\Notifications\AppointmentRescheduledNotification;
use App\Notifications\AppointmentRescheduledByFacultyNotification;
use App\Notifications\AppointmentCancelledNotification;
use App\Notifications\UserRegisteredInAppNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    // ── Notification type → human label map ──────────────────────────────────
    private const TYPE_LABELS = [
        AppointmentApprovedForStudentNotification::class  => 'Appointment Approved',
        AppointmentApprovedForFacultyNotification::class  => 'Appointment Approved',
        AppointmentRescheduledNotification::class         => 'Appointment Rescheduled',
        AppointmentRescheduledByFacultyNotification::class=> 'Appointment Rescheduled',
        AppointmentReminderNotification::class            => 'Appointment Reminder',
        AppointmentRejectedByAdminNotification::class     => 'Appointment Rejected',
        AppointmentRejectedByFacultyNotification::class   => 'Appointment Rejected',
        AppointmentRequestedForFacultyNotification::class => 'New Appointment Request',
        AppointmentInvitedNotification::class             => 'Appointment Invitation',
        AppointmentInviteResponseNotification::class      => 'Invitation Response',
        AppointmentCancelledNotification::class           => 'Appointment Cancelled',
        UserRegisteredInAppNotification::class            => 'New Registration',
    ];

    public function index(Request $request): Response
    {
        $user   = $request->user();
        $filter = $request->query('filter', 'all'); // all | unread | read
        $tab    = $request->query('tab', 'notifications'); // notifications | email_logs

        // ── Build in-app notification items ───────────────────────────────
        $rawNotifs = $this->getRawNotifications($user);

        // Apply read/unread filter
        $filtered = match ($filter) {
            'unread' => $rawNotifs->filter(fn($n) => !$n['read']),
            'read'   => $rawNotifs->filter(fn($n) =>  $n['read']),
            default  => $rawNotifs,
        };

        // Group by (notification_type + sender_key) so same-type same-source merges
        $grouped = $filtered
            ->groupBy(fn($n) => $n['group_key'])
            ->map(function ($group) {
                $first  = $group->first();
                $count  = $group->count();
                $unread = $group->filter(fn($n) => !$n['read'])->count();

                return [
                    'id'          => $first['id'],
                    'group_key'   => $first['group_key'],
                    'type'        => $first['type'],
                    'title'       => $count > 1
                        ? $first['type'] . " ({$count})"
                        : $first['title'],
                    'description' => $first['description'],
                    'created_at'  => $first['created_at'],
                    'href'        => $first['href'],
                    'count'       => $count,
                    'unread'      => $unread,
                    'read'        => $first['read'],
                    'items'       => $group->values()->toArray(),
                ];
            })
            ->sortByDesc(fn($g) => $g['created_at']?->getTimestamp())
            ->take(100)
            ->values();

        // Counts for tab badges
        $totalUnread = $rawNotifs->filter(fn($n) => !$n['read'])->count();

        // ── Email logs (admin only) ───────────────────────────────────────
        $emailLogs = null;
        $logCounts = null;
        if ($user->isAdmin()) {
            $logQuery = NotificationLog::orderByDesc('created_at');

            if ($filter === 'unread') {
                $logQuery->where('status', 'failed');
            } elseif ($filter === 'read') {
                $logQuery->where('status', 'sent');
            }

            $emailLogs = $logQuery->paginate(30)->withQueryString();
            $logCounts = [
                'total'   => NotificationLog::count(),
                'sent'    => NotificationLog::where('status', 'sent')->count(),
                'failed'  => NotificationLog::where('status', 'failed')->count(),
                'pending' => NotificationLog::where('status', 'pending')->count(),
            ];
        }

        return Inertia::render('Notifications/Index', [
            'items'       => $grouped,
            'filter'      => $filter,
            'tab'         => $tab,
            'totalUnread' => $totalUnread,
            'emailLogs'   => $emailLogs,
            'logCounts'   => $logCounts,
            'logTypes'    => NotificationLog::TYPE_LABELS,
        ]);
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back()->with('success', 'All notifications marked as read.');
    }

    // ── Private: build flat notification list from DB ──────────────────────

    private function getRawNotifications($user): \Illuminate\Support\Collection
    {
        $items = collect();

        if (!$user->isAdmin()) {
            // All in-app notifications for this user
            $notifs = $user->notifications()->latest()->limit(200)->get();

            $notifs->each(function ($notification) use ($items, $user) {
                $data  = $notification->data;
                $type  = $notification->type;
                $label = self::TYPE_LABELS[$type] ?? 'Notification';
                $read  = !is_null($notification->read_at);

                // Build description based on type
                $desc = $this->buildDescription($type, $data);

                // group_key: same type + same appointment_id or same source
                $groupKey = $label . '_' . ($data['appointment_id'] ?? $data['event'] ?? $type);

                $items->push([
                    'id'          => $notification->id,
                    'type'        => $label,
                    'group_key'   => $groupKey,
                    'title'       => $desc['title'],
                    'description' => $desc['description'],
                    'created_at'  => $notification->created_at,
                    'href'        => $this->buildHref($type, $data),
                    'read'        => $read,
                    'raw_type'    => $type,
                ]);
            });
        }

        // ── Unread messages (all roles) ────────────────────────────────────
        DB::table('conversation_participants as cp')
            ->join('messages as m', 'm.conversation_id', '=', 'cp.conversation_id')
            ->join('users as sender', 'sender.id', '=', 'm.sender_id')
            ->where('cp.user_id', $user->id)
            ->where('m.sender_id', '!=', $user->id)
            ->where(fn($q) => $q->whereNull('cp.last_read_at')->orWhereColumn('m.created_at', '>', 'cp.last_read_at'))
            ->select('m.id', 'm.conversation_id', 'm.body', 'm.created_at', 'sender.name as sender_name', 'sender.id as sender_id')
            ->orderByDesc('m.created_at')
            ->limit(50)
            ->get()
            ->each(function ($msg) use ($items) {
                $items->push([
                    'id'          => 'msg-' . $msg->id,
                    'type'        => 'Unread Message',
                    'group_key'   => 'Unread Message_' . $msg->sender_id,
                    'title'       => "Message from {$msg->sender_name}",
                    'description' => Str::limit(trim($msg->body), 140),
                    'created_at'  => Carbon::parse($msg->created_at),
                    'href'        => route('messages.show', $msg->conversation_id),
                    'read'        => false,
                    'raw_type'    => 'message',
                ]);
            });

        // ── Admin-only: registrations, appointments, feedback ──────────────
        if ($user->isAdmin()) {
            // In-app DB notifications (registrations etc.)
            $adminNotifs = $user->notifications()->latest()->limit(200)->get();
            $adminNotifs->each(function ($notification) use ($items) {
                $data  = $notification->data;
                $type  = $notification->type;
                $label = self::TYPE_LABELS[$type] ?? 'Notification';
                $read  = !is_null($notification->read_at);
                $desc  = $this->buildDescription($type, $data);

                $groupKey = $label . '_' . ($data['appointment_id'] ?? $data['event'] ?? $data['email'] ?? $type);

                $items->push([
                    'id'          => $notification->id,
                    'type'        => $label,
                    'group_key'   => $groupKey,
                    'title'       => $desc['title'],
                    'description' => $desc['description'],
                    'created_at'  => $notification->created_at,
                    'href'        => $this->buildHref($type, $data),
                    'read'        => $read,
                    'raw_type'    => $type,
                ]);
            });

            // Pending appointments
            Appointment::with(['student:id,name', 'faculty:id,name'])
                ->where('status', 'pending')
                ->latest()
                ->limit(50)
                ->get()
                ->each(function (Appointment $appt) use ($items) {
                    $items->push([
                        'id'          => 'appt-' . $appt->id,
                        'type'        => 'Pending Appointment',
                        'group_key'   => 'Pending Appointment_pending',
                        'title'       => 'Appointment request',
                        'description' => sprintf(
                            '%s requested an appointment with %s: %s',
                            $appt->student?->name ?? 'A student',
                            $appt->faculty?->name ?? 'a faculty member',
                            $appt->title,
                        ),
                        'created_at'  => $appt->created_at,
                        'href'        => route('admin.appointments.index'),
                        'read'        => false,
                        'raw_type'    => 'pending_appointment',
                    ]);
                });

            // Open feedback
            UserFeedback::with('user:id,name')
                ->where('status', 'open')
                ->latest()
                ->limit(50)
                ->get()
                ->each(function (UserFeedback $fb) use ($items) {
                    $items->push([
                        'id'          => 'fb-' . $fb->id,
                        'type'        => 'Open Feedback',
                        'group_key'   => 'Open Feedback_open',
                        'title'       => 'New feedback submitted',
                        'description' => sprintf('%s: %s', $fb->user?->name ?? 'A user', $fb->subject),
                        'created_at'  => $fb->created_at,
                        'href'        => route('admin.feedback.index'),
                        'read'        => false,
                        'raw_type'    => 'feedback',
                    ]);
                });
        }

        return $items->sortByDesc(fn($n) => $n['created_at']?->getTimestamp());
    }

    private function buildDescription(string $type, array $data): array
    {
        $when = isset($data['requested_at'])
            ? Carbon::parse($data['requested_at'])->format('M j, Y g:i A')
            : null;

        return match (true) {
            $type === AppointmentApprovedForStudentNotification::class => [
                'title'       => 'Your appointment was approved',
                'description' => sprintf('%s with %s%s.',
                    $data['title'] ?? 'Appointment',
                    $data['faculty_name'] ?? 'your faculty',
                    $when ? " on {$when}" : '',
                ),
            ],
            $type === AppointmentApprovedForFacultyNotification::class => [
                'title'       => 'New confirmed appointment',
                'description' => sprintf('%s with %s%s.',
                    $data['title'] ?? 'Appointment',
                    $data['student_name'] ?? 'a student',
                    $when ? " on {$when}" : '',
                ),
            ],
            in_array($type, [
                AppointmentRescheduledNotification::class,
                AppointmentRescheduledByFacultyNotification::class,
            ]) => [
                'title'       => 'Appointment rescheduled',
                'description' => sprintf('%s — new schedule: %s.',
                    $data['title'] ?? 'Appointment',
                    $when ?? 'check your appointments',
                ),
            ],
            $type === AppointmentReminderNotification::class => [
                'title'       => 'Appointment reminder',
                'description' => sprintf('%s scheduled for %s.',
                    $data['title'] ?? 'Your appointment',
                    $when ?? 'the scheduled date',
                ),
            ],
            in_array($type, [
                AppointmentRejectedByAdminNotification::class,
                AppointmentRejectedByFacultyNotification::class,
            ]) => [
                'title'       => 'Appointment rejected',
                'description' => sprintf('%s%s.',
                    $data['title'] ?? 'Your appointment',
                    isset($data['admin_notes']) && $data['admin_notes'] ? ' — ' . $data['admin_notes'] : '',
                ),
            ],
            $type === AppointmentRequestedForFacultyNotification::class => [
                'title'       => 'New appointment request',
                'description' => sprintf('%s from %s%s.',
                    $data['title'] ?? 'Appointment',
                    $data['student_name'] ?? 'a student',
                    $when ? " on {$when}" : '',
                ),
            ],
            $type === AppointmentInvitedNotification::class => [
                'title'       => 'You have an appointment invitation',
                'description' => sprintf('%s from %s%s.',
                    $data['title'] ?? 'Appointment',
                    $data['faculty_name'] ?? 'a faculty member',
                    $when ? " on {$when}" : '',
                ),
            ],
            $type === AppointmentInviteResponseNotification::class => [
                'title'       => 'Invitation ' . ($data['response'] ?? 'response'),
                'description' => sprintf('%s — %s.',
                    $data['title'] ?? 'Appointment',
                    $data['student_name'] ?? 'a student',
                ),
            ],
            $type === AppointmentCancelledNotification::class => [
                'title'       => 'Appointment cancelled',
                'description' => sprintf('%s%s.',
                    $data['title'] ?? 'An appointment',
                    isset($data['student_name']) ? ' by ' . $data['student_name'] : '',
                ),
            ],
            $type === UserRegisteredInAppNotification::class => [
                'title'       => 'New account registered',
                'description' => sprintf('%s (%s) registered as %s.',
                    $data['name'] ?? 'A user',
                    $data['email'] ?? '',
                    ucfirst($data['role'] ?? 'user'),
                ),
            ],
            default => [
                'title'       => 'Notification',
                'description' => json_encode($data),
            ],
        };
    }

    private function buildHref(string $type, array $data): string
    {
        return match (true) {
            str_contains($type, 'Admin') || str_contains($type, 'admin')
                => route('admin.appointments.index'),
            str_contains($type, 'Registered')
                => route('admin.users.index'),
            str_contains($type, 'Appointment')
                => route('appointments.index'),
            default
                => route('notifications.index'),
        };
    }
}
