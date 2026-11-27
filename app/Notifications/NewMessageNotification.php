<?php

namespace App\Notifications;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Fired for every participant (except the sender) when a new message arrives.
 * Stored in the `notifications` table (database channel only — no email).
 *
 * The NotificationController already renders unread-message counts from the
 * conversation_participants pivot, so this notification class serves as the
 * persistent bell-notification record that the user can dismiss.
 */
class NewMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Message      $message,
        private readonly Conversation $conversation,
        private readonly User         $sender,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $isGroup  = $this->conversation->type === 'group';
        $convName = $isGroup
            ? ($this->conversation->name ?? 'Group Chat')
            : $this->sender->name;

        $snippet = $this->message->body
            ? (mb_strlen($this->message->body) > 80
                ? mb_substr($this->message->body, 0, 80) . '…'
                : $this->message->body)
            : ($this->message->attachment_name ?? '📎 Attachment');

        return [
            'event'           => 'message.new',
            'conversation_id' => $this->conversation->id,
            'message_id'      => $this->message->id,
            'sender_id'       => $this->sender->id,
            'sender_name'     => $this->sender->name,
            'conversation_name' => $convName,
            'is_group'        => $isGroup,
            'snippet'         => $snippet,
        ];
    }
}
