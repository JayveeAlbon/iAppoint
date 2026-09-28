<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CateringSession;
use App\Models\Meeting;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        abort_if(! $request->user()->isAdmin(), 403);

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

        $meetingStats = [
            'total'     => Meeting::count(),
            'scheduled' => Meeting::where('status', 'scheduled')->count(),
            'ongoing'   => Meeting::where('status', 'ongoing')->count(),
            'completed' => Meeting::where('status', 'completed')->count(),
            'cancelled' => Meeting::where('status', 'cancelled')->count(),
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

        return Inertia::render('Admin/Reports/Index', [
            'userCounts'        => $userCounts,
            'locationStats'     => $locationStats,
            'meetingStats'      => $meetingStats,
            'messageStats'      => $messageStats,
            'cateringStats'     => $cateringStats,
            'registrationTrend' => $registrationTrend,
            'messageTrend'      => $messageTrend,
            'topFaculty'        => $topFaculty,
        ]);
    }
}
