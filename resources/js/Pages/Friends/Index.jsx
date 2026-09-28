import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

function IconSearch() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function IconUserPlus() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
    );
}

function IconMessage() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function IconCheck() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function IconX() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function roleLabel(role) {
    return role === 'faculty' ? 'Faculty' : role === 'admin' ? 'Admin' : 'Student';
}

function avatarColor(name = '') {
    const palette = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return palette[h % palette.length];
}

function Avatar({ name, avatarUrl, size = 9 }) {
    const px = size * 4;
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                style={{ width: px, height: px }}
                className="rounded-full object-cover flex-shrink-0"
            />
        );
    }
    return (
        <div
            className="flex flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ width: px, height: px, background: avatarColor(name) }}
        >
            {initials(name)}
        </div>
    );
}

function FriendCard({ member, onMessage }) {
    function handleUnfriend() {
        if (!confirm(`Remove ${member.name} from your friends?`)) return;
        router.delete(route('friends.destroy', { friendship: member.id }), { preserveScroll: true });
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3.5">
            <Avatar name={member.name} avatarUrl={member.avatar_url} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-400">
                    {roleLabel(member.role)}
                    {member.department ? ` · ${member.department}` : ''}
                </p>
            </div>
            <div className="flex gap-1.5">
                <button
                    onClick={() => onMessage(member.id)}
                    className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                >
                    <IconMessage /> Message
                </button>
                <button
                    onClick={handleUnfriend}
                    className="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    Remove
                </button>
            </div>
        </div>
    );
}

function RequestCard({ friendship }) {
    const requester = friendship.requester;

    function respond(action) {
        router.patch(route('friends.update', { friendship: friendship.id }), { action }, { preserveScroll: true });
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/40 p-3.5">
            <Avatar name={requester.name} avatarUrl={requester.avatar_url} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{requester.name}</p>
                <p className="text-xs text-gray-400">{roleLabel(requester.role)}{requester.department ? ` · ${requester.department}` : ''}</p>
            </div>
            <div className="flex gap-1.5">
                <button
                    onClick={() => respond('accept')}
                    className="flex items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                >
                    <IconCheck /> Accept
                </button>
                <button
                    onClick={() => respond('decline')}
                    className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                >
                    <IconX /> Decline
                </button>
            </div>
        </div>
    );
}

function SuggestionCard({ user }) {
    const { post, processing } = useForm({ user_id: user.id });

    function sendRequest() {
        post(route('friends.store'), { preserveScroll: true });
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3.5">
            <Avatar name={user.name} avatarUrl={user.avatar_url} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">
                    {roleLabel(user.role)}{user.department ? ` · ${user.department}` : ''}
                </p>
            </div>
            <button
                onClick={sendRequest}
                disabled={processing}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
                <IconUserPlus /> Add
            </button>
        </div>
    );
}

export default function FriendsIndex({ friends, pendingIn, pendingOut, suggestions, searchResults, searchQuery }) {
    const [query, setQuery] = useState(searchQuery);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('friends.index'), { q: query }, { preserveState: true, replace: true });
    }

    function startMessage(userId) {
        router.post(route('messages.store'), { type: 'private', recipient_id: userId });
    }

    const showSearch = searchResults.length > 0 || (searchQuery && searchResults.length === 0);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Friends</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {friends.length} friend{friends.length !== 1 ? 's' : ''}
                        {pendingIn.length > 0 && (
                            <span className="ml-2 text-amber-600">· {pendingIn.length} pending request{pendingIn.length !== 1 ? 's' : ''}</span>
                        )}
                    </p>
                </div>
            }
        >
            <Head title="Friends" />

            <div className="space-y-6 p-6">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <IconSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="Search people by name..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Search
                    </button>
                </form>

                {/* Search results */}
                {showSearch && (
                    <section>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            {searchResults.length > 0 ? `Search Results (${searchResults.length})` : `No results for "${searchQuery}"`}
                        </p>
                        {searchResults.length > 0 && (
                            <div className="space-y-2">
                                {searchResults.map(u => <SuggestionCard key={u.id} user={u} />)}
                            </div>
                        )}
                    </section>
                )}

                {/* Incoming requests */}
                {pendingIn.length > 0 && (
                    <section>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                            Friend Requests ({pendingIn.length})
                        </p>
                        <div className="space-y-2">
                            {pendingIn.map(f => <RequestCard key={f.id} friendship={f} />)}
                        </div>
                    </section>
                )}

                {/* People you may know */}
                {!searchQuery && suggestions.length > 0 && (
                    <section>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            People You May Know ({suggestions.length})
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {suggestions.map(u => <SuggestionCard key={u.id} user={u} />)}
                        </div>
                    </section>
                )}

                {/* Friends list */}
                <section>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Friends ({friends.length})
                    </p>
                    {friends.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
                            <p className="text-sm text-gray-400">No friends yet. Add someone from the suggestions above.</p>
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {friends.map(f => (
                                <FriendCard key={f.id} member={f} onMessage={startMessage} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Sent requests */}
                {pendingOut.length > 0 && (
                    <section>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Sent Requests ({pendingOut.length})
                        </p>
                        <div className="space-y-2">
                            {pendingOut.map(f => (
                                <div key={f.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3.5">
                                    <Avatar name={f.addressee.name} avatarUrl={f.addressee.avatar_url} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">{f.addressee.name}</p>
                                        <p className="text-xs text-gray-400">{roleLabel(f.addressee.role)}</p>
                                    </div>
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">Pending</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
