import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconCompose() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
    );
}

function IconUsers() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function relativeTime(dateStr) {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)    return 'now';
    if (mins < 60)   return `${mins}m`;
    if (hours < 24)  return `${hours}h`;
    if (days < 7)    return `${days}d`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── New Group Chat modal ──────────────────────────────────────────────────────

function GroupChatModal({ friends, onClose }) {
    const { data, setData, post, processing } = useForm({
        type: 'group',
        name: '',
        participants: [],
    });

    function toggle(id) {
        setData('participants', data.participants.includes(id)
            ? data.participants.filter(p => p !== id)
            : [...data.participants, id]);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
                <div className="border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900">New Group Chat</h3>
                </div>

                <div className="space-y-4 p-5">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">Group Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="e.g. Study Group"
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">
                            Add Members
                            {data.participants.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 text-blue-600">
                                    {data.participants.length}
                                </span>
                            )}
                        </label>
                        <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200">
                            {friends.length === 0 ? (
                                <p className="px-4 py-6 text-center text-xs text-gray-400">No friends to add.</p>
                            ) : (
                                friends.map(f => (
                                    <label
                                        key={f.id}
                                        className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.participants.includes(f.id)}
                                            onChange={() => toggle(f.id)}
                                            className="rounded border-gray-300 text-blue-500"
                                        />
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-700">
                                            {initials(f.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">{f.name}</p>
                                            <p className="text-xs capitalize text-gray-400">{f.role}</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => post(route('messages.store'), { onSuccess: onClose })}
                        disabled={processing || !data.name.trim() || data.participants.length === 0}
                        className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Conversation row ──────────────────────────────────────────────────────────

function ConversationRow({ conv, currentUserId }) {
    const isGroup     = conv.type === 'group';
    const other       = conv.participants.find(p => p.id !== currentUserId);
    const displayName = isGroup ? (conv.name ?? 'Group Chat') : (other?.name ?? 'Unknown');
    const avatarName  = isGroup ? (conv.name ?? 'G') : (other?.name ?? '?');
    const snippet     = conv.latest_message?.body ?? 'No messages yet';
    const timeStr     = conv.latest_message?.created_at ? relativeTime(conv.latest_message.created_at) : '';
    const unread      = (conv.unread_count ?? 0) > 0;

    return (
        <Link
            href={route('messages.show', { conversation: conv.id })}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {isGroup ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <IconUsers />
                    </div>
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                        {initials(avatarName)}
                    </div>
                )}
                {unread && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
                )}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate text-sm ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                        {displayName}
                    </p>
                    <span className="flex-shrink-0 text-[11px] text-gray-400">{timeStr}</span>
                </div>
                <p className={`truncate text-[13px] ${unread ? 'text-gray-700' : 'text-gray-400'}`}>
                    {snippet.length > 60 ? snippet.slice(0, 60) + '…' : snippet}
                </p>
            </div>

            {/* Unread badge */}
            {unread && (conv.unread_count ?? 0) > 0 && (
                <div className="flex-shrink-0 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {(conv.unread_count ?? 0) > 99 ? '99+' : conv.unread_count}
                </div>
            )}
        </Link>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MessagesIndex({ conversations, friends }) {
    const { auth } = usePage().props;
    const currentUserId = auth.user.id;
    const [showGroupModal, setShowGroupModal] = useState(false);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowGroupModal(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                    >
                        <IconCompose />
                        New Group
                    </button>
                </div>
            }
        >
            <Head title="Messages" />

            {showGroupModal && (
                <GroupChatModal friends={friends} onClose={() => setShowGroupModal(false)} />
            )}

            <div className="flex flex-col">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">No conversations yet</p>
                        <p className="mt-1 text-xs text-gray-400">
                            Go to Friends and click Message to start a private chat.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {conversations.map(conv => (
                            <ConversationRow key={conv.id} conv={conv} currentUserId={currentUserId} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
