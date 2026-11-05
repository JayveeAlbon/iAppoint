<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Friendship;
use App\Models\UserFeedback;
use App\Notifications\AppointmentApprovedForStudentNotification;
use App\Notifications\UserRegisteredInAppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $items = collect();

        if (! $user->isAdmin()) {
            Friendship::with('requester:id,name')
                ->where('addressee_id', $user->id)
                ->where('status', 'pending')
                ->latest()
                ->limit(50)
                ->get()
                ->each(function (Friendship $friendship) use ($items): void {
                    $name = $friendship->requester?->name ?? 'Someone';
                    $items->push([
                        'id' => 'friendship-'.$friendship->id,
                        'type' => 'Friend request',
                        'title' => "Friend request from {$name}",
                        'description' => "{$name} wants to connect with you.",
                        'created_at' => $friendship->created_at,
                        'href' => route('friends.index'),
                    ]);
                });

            $appointmentUpdates = $user->notifications()
                ->where('type', AppointmentApprovedForStudentNotification::class)
                ->latest()
                ->limit(100)
                ->get();

            $appointmentUpdates
                ->whereNull('read_at')
                ->each
                ->markAsRead();

            $appointmentUpdates->each(function ($notification) use ($items): void {
                $data = $notification->data;

                $items->push([
                    'id' => 'appointment-approved-'.$notification->id,
                    'type' => 'Appointment approved',
                    'title' => 'Your appointment was approved',
                    'description' => sprintf(
                        '%s with %s on %s.',
                        $data['title'] ?? 'Appointment',
                        $data['faculty_name'] ?? 'your faculty member',
                        isset($data['requested_at'])
                            ? Carbon::parse($data['requested_at'])->format('M j, Y g:i A')
                            : 'the scheduled date',
                    ),
                    'created_at' => $notification->created_at,
                    'href' => route('appointments.index'),
                ]);
            });
        }

        DB::table('conversation_participants as cp')
            ->join('messages as m', 'm.conversation_id', '=', 'cp.conversation_id')
            ->join('users as sender', 'sender.id', '=', 'm.sender_id')
            ->where('cp.user_id', $user->id)
            ->where('m.sender_id', '!=', $user->id)
            ->where(fn ($query) => $query
                ->whereNull('cp.last_read_at')
                ->orWhereColumn('m.created_at', '>', 'cp.last_read_at'))
            ->select([
                'm.id',
                'm.conversation_id',
                'm.body',
                'm.created_at',
                'sender.name as sender_name',
            ])
            ->orderByDesc('m.created_at')
            ->limit(50)
            ->get()
            ->each(function ($message) use ($items): void {
                $items->push([
                    'id' => 'message-'.$message->id,
                    'type' => 'Unread message',
                    'title' => "Message from {$message->sender_name}",
                    'description' => Str::limit(trim($message->body), 140),
                    'created_at' => Carbon::parse($message->created_at),
                    'href' => route('messages.show', $message->conversation_id),
                ]);
            });

        if ($user->isAdmin()) {
            $registrations = $user->notifications()
                ->where('type', UserRegisteredInAppNotification::class)
                ->latest()
                ->limit(100)
                ->get();

            $registrations
                ->whereNull('read_at')
                ->each
                ->markAsRead();

            $registrations->each(function ($notification) use ($items): void {
                $data = $notification->data;
                $name = $data['name'] ?? 'A new user';
                $registeredRole = $data['role'] ?? 'user';
                $role = ucfirst($registeredRole);

                $items->push([
                    'id' => 'registration-'.$notification->id,
                    'type' => 'New registration',
                    'title' => 'New account registered',
                    'description' => sprintf(
                        '%s (%s) registered as %s.',
                        $name,
                        $data['email'] ?? 'no email',
                        $role,
                    ),
                    'created_at' => $notification->created_at,
                    'href' => route('admin.users.index', array_filter([
                        'q' => $data['email'] ?? null,
                        'role' => $registeredRole,
                        'status' => $registeredRole === 'faculty' ? 'pending' : null,
                    ])),
                ]);
            });

            Appointment::with(['student:id,name', 'faculty:id,name'])
                ->where('status', 'pending')
                ->latest()
                ->limit(50)
                ->get()
                ->each(function (Appointment $appointment) use ($items): void {
                    $items->push([
                        'id' => 'appointment-'.$appointment->id,
                        'type' => 'Pending appointment',
                        'title' => 'Appointment request',
                        'description' => sprintf(
                            '%s requested an appointment with %s: %s',
                            $appointment->student?->name ?? 'A student',
                            $appointment->faculty?->name ?? 'a faculty member',
                            $appointment->title,
                        ),
                        'created_at' => $appointment->created_at,
                        'href' => route('admin.appointments.index'),
                    ]);
                });

            UserFeedback::with('user:id,name')
                ->where('status', 'open')
                ->latest()
                ->limit(50)
                ->get()
                ->each(function (UserFeedback $feedback) use ($items): void {
                    $items->push([
                        'id' => 'feedback-'.$feedback->id,
                        'type' => 'Open feedback',
                        'title' => 'New feedback',
                        'description' => sprintf(
                            '%s submitted feedback: %s',
                            $feedback->user?->name ?? 'A user',
                            $feedback->subject,
                        ),
                        'created_at' => $feedback->created_at,
                        'href' => route('admin.feedback.index'),
                    ]);
                });
        }

        return Inertia::render('Notifications/Index', [
            'items' => $items
                ->sortByDesc(fn (array $item) => $item['created_at']?->getTimestamp())
                ->take(100)
                ->values(),
        ]);
    }
}
