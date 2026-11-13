<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(): Response
    {
        abort_if(!auth()->user()->canActAsFaculty(), 403);

        $schedules = auth()->user()
            ->schedules()
            ->orderByRaw("CASE day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END")
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Schedule/Index', [
            'schedules' => $schedules,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_if(!auth()->user()->canActAsFaculty(), 403);

        $data = $request->validate([
            'day'         => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
            'subject'     => 'required|string|max:255',
            'room'        => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        auth()->user()->schedules()->create($data);

        return back();
    }

    public function update(Request $request, Schedule $schedule): RedirectResponse
    {
        abort_if($schedule->user_id !== auth()->id(), 403);

        $data = $request->validate([
            'day'         => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
            'subject'     => 'required|string|max:255',
            'room'        => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $schedule->update($data);

        return back();
    }

    public function destroy(Schedule $schedule): RedirectResponse
    {
        abort_if($schedule->user_id !== auth()->id(), 403);

        $schedule->delete();

        return back();
    }
}
