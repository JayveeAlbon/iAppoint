<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ConversationService
{
    public function getForUser(User $user): Collection
    {
        return Conversation::whereHas('participants', fn($q) => $q->where('user_id', $user->id))
            ->with([
                'participants:id,name,role,department',
                'latestMessage.sender:id,name',
            ])
            ->orderByDesc(
                Message::select('created_at')
                    ->whereColumn('conversation_id', 'conversations.id')
                    ->latest()
                    ->limit(1)
            )
            ->get()
            ->each(function ($conv) use ($user) {
                $conv->unread_count = $this->unreadCount($conv, $user);
            });
    }

    public function findPrivate(int $userA, int $userB): ?Conversation
    {
        return Conversation::where('type', 'private')
            ->whereHas('participants', fn($q) => $q->where('user_id', $userA))
            ->whereHas('participants', fn($q) => $q->where('user_id', $userB))
            ->first();
    }

    public function createPrivate(User $creator, User $recipient): Conversation
    {
        $existing = $this->findPrivate($creator->id, $recipient->id);
        if ($existing) return $existing;

        return DB::transaction(function () use ($creator, $recipient) {
            $conv = Conversation::create([
                'type'       => 'private',
                'created_by' => $creator->id,
            ]);

            $conv->participants()->attach([
                $creator->id   => ['joined_at' => now()],
                $recipient->id => ['joined_at' => now()],
            ]);

            return $conv;
        });
    }

    public function createGroup(User $creator, string $name, array $participantIds): Conversation
    {
        return DB::transaction(function () use ($creator, $name, $participantIds) {
            $conv = Conversation::create([
                'type'       => 'group',
                'name'       => $name,
                'created_by' => $creator->id,
            ]);

            $ids = array_unique(array_merge([$creator->id], $participantIds));
            $attach = [];
            foreach ($ids as $id) {
                $attach[$id] = ['joined_at' => now()];
            }
            $conv->participants()->attach($attach);

            return $conv;
        });
    }

    public function sendMessage(
        Conversation $conversation,
        User $sender,
        ?string $body,
        ?string $attachment = null,
        ?string $attachmentName = null,
    ): Message {
        $message = $conversation->messages()->create([
            'sender_id'       => $sender->id,
            'body'            => $body ?? '',
            'type'            => $attachment ? 'file' : 'text',
            'attachment'      => $attachment,
            'attachment_name' => $attachmentName,
        ]);

        $this->markRead($conversation, $sender);

        return $message->load('sender:id,name,role');
    }

    public function markRead(Conversation $conversation, User $user): void
    {
        $conversation->participants()->updateExistingPivot($user->id, [
            'last_read_at' => now(),
        ]);
    }

    public function unreadCount(Conversation $conversation, User $user): int
    {
        $pivot = $conversation->participants->firstWhere('id', $user->id)?->pivot;

        $query = $conversation->messages()->where('sender_id', '!=', $user->id);

        if ($pivot?->last_read_at) {
            $query->where('created_at', '>', $pivot->last_read_at);
        }

        return $query->count();
    }

    public function getMessages(Conversation $conversation, int $limit = 100): Collection
    {
        return $conversation->messages()
            ->with('sender:id,name,role')
            ->latest()
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();
    }
}
