<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FacultyController extends Controller
{
    public function index(): Response
    {
        $faculty = User::where('role', 'faculty')
            ->withCount('schedules')
            ->with('facultyStatus')
            ->select('id', 'name', 'email', 'avatar', 'department', 'office_location', 'latitude', 'longitude', 'updated_at')
            ->orderBy('name')
            ->get()
            ->map(fn($f) => array_merge($f->toArray(), ['avatar_url' => $f->avatar_url]));

        return Inertia::render('Faculty/Directory', [
            'faculty' => $faculty,
        ]);
    }

    public function map(): Response
    {
        $today = now()->format('l'); // e.g. "Monday"

        $located = User::where('role', 'faculty')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with(['schedules' => function ($q) use ($today) {
                $q->where('day', $today)
                  ->orderBy('start_time')
                  ->select('id', 'user_id', 'start_time', 'end_time', 'subject', 'room');
            }])
            ->select('id', 'name', 'avatar', 'department', 'office_location', 'latitude', 'longitude', 'updated_at')
            ->get()
            ->map(fn($f) => array_merge($f->toArray(), ['avatar_url' => $f->avatar_url]));

        $unlocated = User::where('role', 'faculty')
            ->whereNull('latitude')
            ->select('id', 'name', 'avatar', 'department', 'office_location')
            ->orderBy('name')
            ->get()
            ->map(fn($f) => array_merge($f->toArray(), ['avatar_url' => $f->avatar_url]));

        return Inertia::render('Faculty/Map', [
            'faculty'        => $located,
            'offlineFaculty' => $unlocated,
            'today'          => $today,
        ]);
    }

    public function schedule(User $faculty): Response
    {
        abort_if($faculty->role !== 'faculty', 404);

        $schedules = $faculty->schedules()
            ->orderByRaw("FIELD(day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')")
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Faculty/FacultySchedule', [
            'faculty'   => $faculty->only('id', 'name', 'department', 'office_location', 'latitude', 'longitude'),
            'schedules' => $schedules,
            'today'     => now()->format('l'),
        ]);
    }

    public function storeConsent(Request $request): RedirectResponse
    {
        abort_if($request->user()->role !== 'faculty', 403);

        $request->user()->update(['location_consent_at' => now()]);

        return back();
    }

    public function revokeConsent(Request $request): RedirectResponse
    {
        abort_if($request->user()->role !== 'faculty', 403);

        $request->user()->update([
            'location_consent_at' => null,
            'latitude'            => null,
            'longitude'           => null,
        ]);

        return back();
    }

    public function updateLocation(Request $request): JsonResponse
    {
        abort_if($request->user()->role !== 'faculty', 403, 'Only faculty can share location.');

        $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $request->user()->update([
            'latitude'  => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json(['ok' => true]);
    }

    public function clearLocation(Request $request): RedirectResponse
    {
        abort_if($request->user()->role !== 'faculty', 403);

        $request->user()->update([
            'latitude'  => null,
            'longitude' => null,
        ]);

        return back();
    }
}
