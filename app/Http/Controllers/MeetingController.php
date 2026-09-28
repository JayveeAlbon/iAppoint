<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateMeetingRequest;
use App\Http\Requests\UpdateMeetingStatusRequest;
use App\Models\Meeting;
use App\Services\FriendshipService;
use App\Services\MeetingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MeetingController extends Controller
{
    public function __construct(
        private readonly MeetingService    $meetings,
        private readonly FriendshipService $friendships,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        $mine = Meeting::where('created_by', $user->id)
            ->with(['participants:id,name,role,department'])
            ->withCount('participants')
            ->orderByDesc('scheduled_at')
            ->get();

        $invited = $user->meetings()
            ->with(['creator:id,name,role,department', 'participants:id,name,role,department'])
            ->withCount('participants')
            ->orderByDesc('scheduled_at')
            ->get();

        if ($user->isAdmin()) {
            $participants = \App\Models\User::where('status', 'active')
                ->where('role', '!=', 'admin')
                ->orderBy('name')
                ->get(['id', 'name', 'role', 'department']);
        } elseif ($user->isFaculty()) {
            $participants = $this->friendships->getFriends($user)
                ->filter(fn($f) => $f->role !== 'admin')
                ->values();
        } else {
            $participants = collect();
        }

        return Inertia::render('Meetings/Index', [
            'mine'         => $mine,
            'invited'      => $invited,
            'participants' => $participants,
        ]);
    }

    public function store(CreateMeetingRequest $request): RedirectResponse
    {
        $meeting = $this->meetings->create(
            $request->user(),
            $request->only('title', 'scheduled_at', 'duration_minutes'),
            $request->participants,
        );

        return redirect()->route('meetings.show', $meeting)
            ->with('success', 'Meeting scheduled.');
    }

    public function show(Request $request, Meeting $meeting): Response
    {
        $this->authorize('view', $meeting);

        $meeting->load([
            'creator:id,name,role,department',
            'participants:id,name,role,department',
            'cateringSessions.student:id,name,role',
        ]);

        return Inertia::render('Meetings/Show', [
            'meeting'     => $meeting,
            'currentUser' => $request->user()->only('id', 'name', 'role'),
        ]);
    }

    public function update(UpdateMeetingStatusRequest $request, Meeting $meeting): RedirectResponse
    {
        $this->authorize('manage', $meeting);

        match ($request->status) {
            'ongoing'   => $this->meetings->start($meeting),
            'completed' => $this->meetings->end($meeting),
            'cancelled' => $this->meetings->cancel($meeting),
        };

        return back()->with('success', 'Meeting updated.');
    }

    public function respond(Request $request, Meeting $meeting): RedirectResponse
    {
        $this->authorize('respond', $meeting);
        $request->validate(['response' => 'required|in:accepted,declined']);

        $this->meetings->respond($meeting, $request->user(), $request->response);

        return back()->with('success', 'Response recorded.');
    }

    public function destroy(Meeting $meeting): RedirectResponse
    {
        $this->authorize('manage', $meeting);
        $this->meetings->cancel($meeting);

        return redirect()->route('meetings.index')
            ->with('success', 'Meeting cancelled.');
    }
}
