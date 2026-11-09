<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CateringSession;
use App\Models\Message;
use App\Models\User;
use App\Notifications\AppointmentApprovedForStudentNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->isAdmin()) {
            // ── Faculty stats ──────────────────────────────────────────────────────
            $facultyStats = null;
            if ($user->isFaculty()) {
                $facultyAppts = Appointment::where('faculty_id', $user->id);
                $facultyStats = [
                    'totalStudents'    => User::where('role', 'student')->where('status', 'active')->count(),
                    'appointmentsToday' => (clone $facultyAppts)
                        ->whereDate('requested_at', today())
                        ->whereIn('status', ['pending', 'approved'])
                        ->count(),
                    'pendingRequests'  => (clone $facultyAppts)->where('status', 'pending')->count(),
                    'completed'        => (clone $facultyAppts)->where('status', 'completed')->count(),
                ];

                $upcomingFaculty = (clone $facultyAppts)
                    ->where('status', 'approved')
                    ->where('requested_at', '>=', now())
                    ->with('student:id,name,course,year_level')
                    ->orderBy('requested_at')
                    ->limit(5)
                    ->get(['id', 'student_id', 'title', 'requested_at'])
                    ->map(fn (Appointment $a) => [
                        'id'           => $a->id,
                        'title'        => $a->title,
                        'student'      => $a->student?->name ?? 'Student',
                        'requested_at' => $a->requested_at?->toIso8601String(),
                    ])
                    ->values();
            }

            // ── Student stats ──────────────────────────────────────────────────────
            $studentAppointments = $user->isStudent()
                ? Appointment::where('student_id', $user->id)
                : null;

            $appointmentUpdates = $user->isStudent()
                ? $user->unreadNotifications()
                    ->where('type', AppointmentApprovedForStudentNotification::class)
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn ($notification) => [
                        'id' => $notification->id,
                        'title' => $notification->data['title'] ?? 'Appointment approved',
                        'faculty' => $notification->data['faculty_name'] ?? 'Faculty member',
                        'requested_at' => $notification->data['requested_at'] ?? null,
                        'admin_notes' => $notification->data['admin_notes'] ?? null,
                    ])
                    ->values()
                : [];

            $upcomingAppointments = $studentAppointments
                ? (clone $studentAppointments)
                    ->where('status', 'approved')
                    ->where('requested_at', '>=', now())
                    ->with('faculty:id,name')
                    ->orderBy('requested_at')
                    ->limit(5)
                    ->get(['id', 'faculty_id', 'title', 'requested_at'])
                    ->map(fn (Appointment $appointment) => [
                        'id' => $appointment->id,
                        'title' => $appointment->title,
                        'faculty' => $appointment->faculty?->name ?? 'Faculty member',
                        'requested_at' => $appointment->requested_at?->toIso8601String(),
                    ])
                    ->values()
                : [];

            return Inertia::render('Dashboard', [
                'facultyStats'        => $facultyStats,
                'upcomingFacultyAppts'=> $facultyStats ? $upcomingFaculty : [],
                'appointmentUpdates'  => $appointmentUpdates,
                'appointmentSummary'  => $studentAppointments ? [
                    'upcoming' => (clone $studentAppointments)
                        ->where('status', 'approved')
                        ->where('requested_at', '>=', now())
                        ->count(),
                    'completedThisMonth' => (clone $studentAppointments)
                        ->where('status', 'completed')
                        ->whereBetween('updated_at', [now()->startOfMonth(), now()->endOfMonth()])
                        ->count(),
                    'pending' => (clone $studentAppointments)
                        ->where('status', 'pending')
                        ->count(),
                    'rejected' => (clone $studentAppointments)
                        ->where('status', 'rejected')
                        ->count(),
                ] : null,
                'upcomingAppointments' => $upcomingAppointments,
            ]);
        }

        $userCounts = [
            'total'     => User::count(),
            'faculty'   => User::where('role', 'faculty')->count(),
            'student'   => User::where('role', 'student')->count(),
            'admin'     => User::where('role', 'admin')->count(),
            'pending'   => User::where('status', 'pending')->count(),
            'active'    => User::where('status', 'active')->count(),
            'suspended' => User::where('status', 'suspended')->count(),
        ];

        $locationStats = [
            'sharing'   => User::where('role', 'faculty')->whereNotNull('latitude')->count(),
            'consented' => User::where('role', 'faculty')->whereNotNull('location_consent_at')->count(),
            'total'     => User::where('role', 'faculty')->count(),
        ];

        $messageStats = [
            'total'        => Message::count(),
            'last_7_days'  => Message::where('created_at', '>=', now()->subDays(7))->count(),
            'last_30_days' => Message::where('created_at', '>=', now()->subDays(30))->count(),
        ];

        $cateringStats = [
            'active'    => CateringSession::whereNull('ended_at')->count(),
            'today'     => CateringSession::whereDate('started_at', today())->count(),
            'this_week' => CateringSession::where('started_at', '>=', now()->startOfWeek())->count(),
        ];

        // Registration trend — fill all 14 days, no gaps
        $regRaw = User::select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays(13))
            ->groupBy('date')->orderBy('date')->get()->keyBy('date');

        $registrationTrend = collect();
        for ($i = 13; $i >= 0; $i--) {
            $d = now()->subDays($i);
            $registrationTrend->push(['date' => $d->format('M d'), 'count' => $regRaw->get($d->toDateString())?->count ?? 0]);
        }

        // Message activity — fill all 30 days
        $msgRaw = Message::select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays(29))
            ->groupBy('date')->orderBy('date')->get()->keyBy('date');

        $messageTrend = collect();
        for ($i = 29; $i >= 0; $i--) {
            $d = now()->subDays($i);
            $messageTrend->push(['date' => $d->format('M d'), 'count' => $msgRaw->get($d->toDateString())?->count ?? 0]);
        }

        $topFaculty = User::where('role', 'faculty')
            ->withCount('schedules')
            ->with('facultyStatus')
            ->orderByDesc('schedules_count')
            ->limit(5)
            ->get(['id', 'name', 'department']);

        return Inertia::render('Dashboard', [
            'reports' => [
                'userCounts'        => $userCounts,
                'locationStats'     => $locationStats,
                'messageStats'      => $messageStats,
                'cateringStats'     => $cateringStats,
                'registrationTrend' => $registrationTrend,
                'messageTrend'      => $messageTrend,
                'topFaculty'        => $topFaculty,
            ],
        ]);
    }
}
