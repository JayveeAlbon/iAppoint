<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendFriendRequestRequest;
use App\Models\Friendship;
use App\Models\User;
use App\Services\FriendshipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FriendController extends Controller
{
    public function __construct(private readonly FriendshipService $friendships) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $friends       = $this->friendships->getFriends($user);
        $pendingIn     = $this->friendships->pendingReceived($user);
        $pendingOut    = $this->friendships->pendingSent($user);

        $excludeIds = $friends->pluck('id')
            ->merge($pendingIn->pluck('requester_id'))
            ->merge($pendingOut->pluck('addressee_id'))
            ->push($user->id)
            ->unique()
            ->all();

        $searchQuery   = $request->input('q', '');
        $searchResults = [];

        if (mb_strlen($searchQuery) >= 2) {
            $searchResults = User::where('name', 'like', "%{$searchQuery}%")
                ->where('status', 'active')
                ->whereNotIn('id', $excludeIds)
                ->select('id', 'name', 'role', 'department', 'office_location')
                ->orderBy('name')
                ->limit(20)
                ->get();
        }

        $suggestions = User::where('status', 'active')
            ->whereNotIn('id', $excludeIds)
            ->select('id', 'name', 'role', 'department', 'office_location')
            ->orderBy('name')
            ->limit(20)
            ->get();

        return Inertia::render('Friends/Index', [
            'friends'       => $friends->values(),
            'pendingIn'     => $pendingIn,
            'pendingOut'    => $pendingOut,
            'suggestions'   => $suggestions,
            'searchResults' => $searchResults,
            'searchQuery'   => $searchQuery,
        ]);
    }

    public function store(SendFriendRequestRequest $request): RedirectResponse
    {
        $receiver = User::findOrFail($request->validated('user_id'));

        $existing = $this->friendships->findBetween($request->user()->id, $receiver->id);
        if ($existing) {
            return back()->with('error', 'A friendship request already exists.');
        }

        $this->friendships->sendRequest($request->user(), $receiver);

        return back()->with('success', 'Friend request sent.');
    }

    public function update(Request $request, Friendship $friendship): RedirectResponse
    {
        $this->authorize('respond', $friendship);

        $request->validate(['action' => 'required|in:accept,decline']);

        match ($request->action) {
            'accept'  => $this->friendships->accept($friendship),
            'decline' => $this->friendships->decline($friendship),
        };

        return back()->with('success', 'Request updated.');
    }

    public function destroy(Friendship $friendship): RedirectResponse
    {
        $this->authorize('delete', $friendship);
        $this->friendships->unfriend($friendship);

        return back()->with('success', 'Friend removed.');
    }
}
