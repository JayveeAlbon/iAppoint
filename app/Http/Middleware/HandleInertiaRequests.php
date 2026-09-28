<?php

namespace App\Http\Middleware;

use App\Models\Appointment;
use App\Models\Friendship;
use App\Models\UserFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge(
                    $user->load('facultyStatus')->toArray(),
                    ['avatar_url' => $user->avatar_url]
                ) : null,
            ],
            'notifications' => $user ? $this->buildNotifications($user) : null,
            'google_client_id' => config('services.google.client_id'),
            'flash' => [
                'status'     => fn () => $request->session()->get('status'),
                'success'    => fn () => $request->session()->get('success'),
                'error'      => fn () => $request->session()->get('error'),
                'registered' => fn () => $request->session()->get('registered'),
            ],
        ];
    }

    private function buildNotifications(\App\Models\User $user): array
    {
        $pendingFriends = Friendship::where('addressee_id', $user->id)
            ->where('status', 'pending')
            ->count();

        $unreadMessages = DB::table('conversation_participants as cp')
            ->join('messages as m', 'm.conversation_id', '=', 'cp.conversation_id')
            ->where('cp.user_id', $user->id)
            ->where('m.sender_id', '!=', $user->id)
            ->where(fn($q) => $q
                ->whereNull('cp.last_read_at')
                ->orWhereRaw('m.created_at > cp.last_read_at')
            )
            ->count();

        $pendingAppointments = $user->isAdmin()
            ? Appointment::where('status', 'pending')->count()
            : 0;

        $pendingAdminFeedback = $user->isAdmin()
            ? UserFeedback::where('status', 'open')->count()
            : 0;

        return [
            'pending_friends'         => $pendingFriends,
            'unread_messages'         => $unreadMessages,
            'pending_appointments'    => $pendingAppointments,
            'pending_admin_feedback'  => $pendingAdminFeedback,
        ];
    }
}
