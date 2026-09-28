<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateConversationRequest;
use App\Http\Requests\SendMessageRequest;
use App\Models\Conversation;
use App\Models\User;
use App\Services\ConversationService;
use App\Services\FriendshipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversations,
        private readonly FriendshipService   $friendships,
    ) {}

    public function index(Request $request): Response
    {
        $user  = $request->user();
        $convs = $this->conversations->getForUser($user);

        return Inertia::render('Messages/Index', [
            'conversations' => $convs,
            'friends'       => $this->friendships->getFriends($user)->values(),
        ]);
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

        $conversation->load('participants:id,name,role,department');

        return Inertia::render('Messages/Show', [
            'conversation' => $conversation,
            'messages'     => $messages,
            'currentUser'  => $user->only('id', 'name', 'role'),
        ]);
    }

    public function sendMessage(SendMessageRequest $request, Conversation $conversation): RedirectResponse
    {
        $this->authorize('sendMessage', $conversation);

        $attachment = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachment = $file->store('attachments', 'public');
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
