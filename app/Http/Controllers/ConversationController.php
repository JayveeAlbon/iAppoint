<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateConversationRequest;
use App\Http\Requests\SendMessageRequest;
use App\Models\Conversation;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Services\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversations,
    ) {}

    /**
     * Conversation list — no longer needs the friends list; the
     * user-picker modal fetches users via searchUsers() instead.
     */
    public function index(Request $request): Response
    {
        $user  = $request->user();
        $convs = $this->conversations->getForUser($user);

        return Inertia::render('Messages/Index', [
            'conversations' => $convs,
        ]);
    }

    /**
     * JSON search endpoint for the new-chat user picker.
     * Returns active users (excluding the caller) whose name or email
     * contains the given query string.
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $q    = trim($request->get('q', ''));
        $user = $request->user();

        $users = User::where('id', '!=', $user->id)
            ->where('status', 'active')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner->where('name', 'ilike', "%{$q}%")
                          ->orWhere('email', 'ilike', "%{$q}%");
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'email', 'role', 'department', 'avatar']);

        // Append avatar_url for each user
        $users->each(function ($u) {
            $u->avatar_url = $u->avatar ? asset(ltrim($u->avatar, '/')) : null;
        });

        return response()->json($users);
    }

    public function store(CreateConversationRequest $request): RedirectResponse
    {
        $user = $request->user();

        $conv = match ($request->type) {
            'private' => $this->conversations->createPrivate(
                $user,
                User::findOrFail($request->recipient_id),
            ),
            'group' => $this->conversations->createGroup(
                $user,
                $request->name,
                $request->participants ?? [],
            ),
        };

        return redirect()->route('messages.show', $conv);
    }

    public function show(Request $request, Conversation $conversation): Response
    {
        $this->authorize('view', $conversation);

        $user     = $request->user();
        $messages = $this->conversations->getMessages($conversation);

        $this->conversations->markRead($conversation, $user);

        // Mark any NewMessageNotification records for this conversation as read
        $user->unreadNotifications()
            ->where('type', NewMessageNotification::class)
            ->whereJsonContains('data->conversation_id', $conversation->id)
            ->update(['read_at' => now()]);

        $conversation->load('participants:id,name,role,department,avatar');

        // Append avatar_url to each participant
        $conversation->participants->each(function ($p) {
            $p->avatar_url = $p->avatar ? asset(ltrim($p->avatar, '/')) : null;
        });

        return Inertia::render('Messages/Show', [
            'conversation' => $conversation,
            'messages'     => $messages,
            'currentUser'  => $user->only('id', 'name', 'role'),
        ]);
    }

    public function sendMessage(SendMessageRequest $request, Conversation $conversation): RedirectResponse
    {
        $this->authorize('sendMessage', $conversation);

        $attachment     = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file           = $request->file('attachment');
            $attachment     = $file->store('attachments', 'public');
            $attachmentName = $file->getClientOriginalName();
        }

        $this->conversations->sendMessage(
            $conversation,
            $request->user(),
            $request->body,
            $attachment,
            $attachmentName,
        );

        return back();
    }
}
