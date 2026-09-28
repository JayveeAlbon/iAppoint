<?php

namespace App\Services;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FriendshipService
{
    public function getFriends(User $user): Collection
    {
        $friendships = Friendship::where('status', 'accepted')
            ->where(fn($q) => $q
                ->where('requester_id', $user->id)
                ->orWhere('addressee_id', $user->id)
            )
            ->with(['requester:id,name,role,department,office_location,latitude,longitude',
                    'addressee:id,name,role,department,office_location,latitude,longitude'])
            ->get();

        return $friendships->map(fn($f) => $f->otherUser($user->id));
    }

    public function getFriendIds(User $user): array
    {
        return Friendship::where('status', 'accepted')
            ->where(fn($q) => $q
                ->where('requester_id', $user->id)
                ->orWhere('addressee_id', $user->id)
            )
            ->get()
            ->map(fn($f) => $f->requester_id === $user->id ? $f->addressee_id : $f->requester_id)
            ->all();
    }

    public function sendRequest(User $sender, User $receiver): Friendship
    {
        $existing = $this->findBetween($sender->id, $receiver->id);

        if ($existing) {
            throw new \RuntimeException('A friendship record already exists between these users.');
        }

        return Friendship::create([
            'requester_id' => $sender->id,
            'addressee_id' => $receiver->id,
            'status'       => 'pending',
        ]);
    }

    public function accept(Friendship $friendship): void
    {
        $friendship->update(['status' => 'accepted']);
    }

    public function decline(Friendship $friendship): void
    {
        $friendship->update(['status' => 'declined']);
    }

    public function unfriend(Friendship $friendship): void
    {
        $friendship->delete();
    }

    public function findBetween(int $userA, int $userB): ?Friendship
    {
        return Friendship::where(fn($q) => $q
                ->where('requester_id', $userA)->where('addressee_id', $userB)
            )
            ->orWhere(fn($q) => $q
                ->where('requester_id', $userB)->where('addressee_id', $userA)
            )
            ->first();
    }

    public function statusFor(User $viewer, int $targetId): ?string
    {
        $f = $this->findBetween($viewer->id, $targetId);
        return $f?->status;
    }

    public function pendingReceived(User $user): Collection
    {
        return Friendship::where('addressee_id', $user->id)
            ->where('status', 'pending')
            ->with('requester:id,name,role,department')
            ->get();
    }

    public function pendingSent(User $user): Collection
    {
        return Friendship::where('requester_id', $user->id)
            ->where('status', 'pending')
            ->with('addressee:id,name,role,department')
            ->get();
    }
}
