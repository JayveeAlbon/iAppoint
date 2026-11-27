import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconCompose() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
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

function IconSearch() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function IconX() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function IconMessage() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function IconChevronRight() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name = '') {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name = '') {
    const palette = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6','#06B6D4'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return palette[h % palette.length];
}

function relativeTime(dateStr) {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)   return 'now';
    if (mins < 60)  return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7)   return `${days}d`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── UserAvatar ─────────────────────────────────────────────────────────────────

function UserAvatar({ name, avatarUrl, size = 10, colorSeed }) {
    const color = avatarColor(colorSeed ?? name);
    const dim   = `h-${size} w-${size}`;
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className={`${dim} rounded-full object-cover flex-shrink-0`}
            />
        );
    }
    return (
        <div
            className={`${dim} flex flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white`}
            style={{ backgroundColor: color }}
        >
            {initials(name)}
        </div>
    );
}

// ── User search hook ───────────────────────────────────────────────────────────

function useUserSearch() {
    const [query, setQuery]     = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const timer                 = useRef(null);

    const search = useCallback((q) => {
        setQuery(q);
        clearTimeout(timer.current);
        if (q.trim().length === 0) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        timer.current = setTimeout(async () => {
            try {
                const res  = await fetch(route('messages.users.search') + '?q=' + encodeURIComponent(q));
                const data = await res.json();
                setResults(data);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 280);
    }, []);

    const reset = useCallback(() => {
        setQuery('');
        setResults([]);
        setLoading(false);
        clearTimeout(timer.current);
    }, []);

    return { query, results, loading, search, reset };
}

// ── New Private Chat modal ─────────────────────────────────────────────────────

function NewPrivateChatModal({ onClose }) {
    const { post, processing } = useForm({ type: 'private', recipient_id: null });
    const { query, results, loading, search, reset } = useUserSearch();
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    function startChat(userId) {
        post(route('messages.store'), {
            data: { type: 'private', recipient_id: userId },
            onSuccess: onClose,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900">New Message</h3>
                    <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <IconX />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                        <span className="flex-shrink-0 text-gray-400"><IconSearch /></span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => search(e.target.value)}
                            placeholder="Search by name or email…"
                            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                        />
                        {query && (
                            <button onClick={() => reset()} className="text-gray-400 hover:text-gray-600">
                                <IconX />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto px-2 pb-4">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                    )}

                    {!loading && query.trim() === '' && (
                        <p className="px-3 py-6 text-center text-xs text-gray-400">
                            Type a name or email to find someone
                        </p>
                    )}

                    {!loading && query.trim() !== '' && results.length === 0 && (
                        <p className="px-3 py-6 text-center text-xs text-gray-400">No users found</p>
                    )}

                    {!loading && results.map(u => (
                        <button
                            key={u.id}
                            onClick={() => startChat(u.id)}
                            disabled={processing}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
                        >
                            <UserAvatar name={u.name} avatarUrl={u.avatar_url} size={9} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                                <p className="truncate text-xs capitalize text-gray-400">
                                    {u.role}{u.department ? ` · ${u.department}` : ''}
                                </p>
                            </div>
                            <span className="flex-shrink-0 text-gray-300"><IconChevronRight /></span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── New Group Chat modal ───────────────────────────────────────────────────────

function NewGroupChatModal({ onClose }) {
    const { data, setData, post, processing } = useForm({
        type: 'group',
        name: '',
        participants: [],
    });
    const { query, results, loading, search, reset } = useUserSearch();
    const [selected, setSelected] = useState([]); // [{ id, name, role, avatar_url }]
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    function toggleUser(u) {
        if (selected.find(s => s.id === u.id)) {
            const next = selected.filter(s => s.id !== u.id);
            setSelected(next);
            setData('participants', next.map(s => s.id));
        } else {
            const next = [...selected, u];
            setSelected(next);
            setData('participants', next.map(s => s.id));
        }
    }

    function isSelected(id) {
        return selected.some(s => s.id === id);
    }

    function submit() {
        post(route('messages.store'), { onSuccess: onClose });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900">New Group Chat</h3>
                    <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <IconX />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    {/* Group name */}
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

                    {/* Selected members chips */}
                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selected.map(u => (
                                <span
                                    key={u.id}
                                    className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                                >
                                    {u.name}
                                    <button
                                        type="button"
                                        onClick={() => toggleUser(u)}
                                        className="rounded-full text-blue-400 hover:text-blue-700"
                                    >
                                        <IconX />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">
                            Add Members
                            {selected.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-600">
                                    {selected.length}
                                </span>
                            )}
                        </label>
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                            <span className="flex-shrink-0 text-gray-400"><IconSearch /></span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => search(e.target.value)}
                                placeholder="Search users…"
                                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                            />
                        </div>

                        <div className="mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-gray-100">
                            {loading && (
                                <div className="flex justify-center py-4">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                </div>
                            )}
                            {!loading && query.trim() === '' && (
                                <p className="px-4 py-4 text-center text-xs text-gray-400">Type to search for users</p>
                            )}
                            {!loading && query.trim() !== '' && results.length === 0 && (
                                <p className="px-4 py-4 text-center text-xs text-gray-400">No users found</p>
                            )}
                            {!loading && results.map(u => (
                                <label
                                    key={u.id}
                                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected(u.id)}
                                        onChange={() => toggleUser(u)}
                                        className="rounded border-gray-300 text-blue-500"
                                    />
                                    <UserAvatar name={u.name} avatarUrl={u.avatar_url} size={8} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                                        <p className="truncate text-xs capitalize text-gray-400">
                                            {u.role}{u.department ? ` · ${u.department}` : ''}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing || !data.name.trim() || data.participants.length === 0}
                        className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                        {processing ? 'Creating…' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Conversation row ───────────────────────────────────────────────────────────

function ConversationRow({ conv, currentUserId }) {
    const isGroup     = conv.type === 'group';
    const other       = conv.participants?.find(p => p.id !== currentUserId);
    const displayName = isGroup ? (conv.name ?? 'Group Chat') : (other?.name ?? 'Unknown');
    const avatarUrl   = !isGroup ? (other?.avatar_url ?? null) : null;
    const unread      = (conv.unread_count ?? 0) > 0;

    const latestMsg   = conv.latest_message;
    let snippet       = 'No messages yet';
    if (latestMsg) {
        if (latestMsg.attachment_name && !latestMsg.body?.trim()) {
            snippet = `📎 ${latestMsg.attachment_name}`;
        } else {
            snippet = latestMsg.body ?? '';
        }
    }
    const timeStr = latestMsg?.created_at ? relativeTime(latestMsg.created_at) : '';

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
                    <UserAvatar name={displayName} avatarUrl={avatarUrl} size={12} />
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

            {/* Unread count badge */}
            {unread && (
                <div className="flex-shrink-0 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                </div>
            )}
        </Link>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MessagesIndex({ conversations }) {
    const { auth } = usePage().props;
    const currentUserId    = auth.user.id;
    const [modal, setModal] = useState(null); // null | 'private' | 'group'

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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setModal('private')}
                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            <IconCompose />
                            New Chat
                        </button>
                        <button
                            onClick={() => setModal('group')}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                        >
                            <IconUsers />
                            New Group
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Messages" />

            {modal === 'private' && <NewPrivateChatModal onClose={() => setModal(null)} />}
            {modal === 'group'   && <NewGroupChatModal   onClose={() => setModal(null)} />}

            <div className="flex flex-col">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                            <IconMessage />
                        </div>
                        <p className="text-sm font-medium text-gray-700">No conversations yet</p>
                        <p className="mt-1 text-xs text-gray-400">
                            Start a new chat using the buttons above.
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
