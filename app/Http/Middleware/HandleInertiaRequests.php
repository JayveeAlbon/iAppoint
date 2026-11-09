<?php

namespace App\Http\Middleware;

use App\Models\Appointment;
use App\Models\User;
use App\Models\UserFeedback;
use App\Notifications\AppointmentApprovedForStudentNotification;
use App\Notifications\UserRegisteredInAppNotification;
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

        $pendingFaculty = $user->isAdmin()
            ? User::where('role', 'faculty')->where('status', 'pending')->count()
            : 0;

        $pendingAdminFeedback = $user->isAdmin()
            ? UserFeedback::where('status', 'open')->count()
            : 0;
        $newRegistrations = $user->isAdmin()
            ? $user->unreadNotifications()
                ->where('type', UserRegisteredInAppNotification::class)
                ->count()
            : 0;
        $approvedAppointments = $user->isStudent()
            ? $user->unreadNotifications()
                ->where('type', AppointmentApprovedForStudentNotification::class)
                ->count()
            : 0;
        $total = $unreadMessages
            + $newRegistrations
            + $approvedAppointments
            + $pendingAppointments
            + $pendingAdminFeedback;

        return [
            'unread_messages'         => $unreadMessages,
            'pending_faculty'         => $pendingFaculty,
            'pending_appointments'    => $pendingAppointments,
            'pending_admin_feedback'  => $pendingAdminFeedback,
            'new_registrations'       => $newRegistrations,
            'approved_appointments'   => $approvedAppointments,
            'total'                   => $total,
        ];
    }
}
