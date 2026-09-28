import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconPlus() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_STYLES = {
    scheduled: 'bg-blue-50 text-blue-700',
    ongoing:   'bg-green-50 text-green-700',
    completed: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-50 text-red-500',
};

function StatusBadge({ status }) {
    const labels = {
        scheduled: 'Scheduled',
        ongoing:   'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
    };
    return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
            {labels[status]}
        </span>
    );
}

function formatScheduled(dateStr) {
    return new Date(dateStr).toLocaleString([], {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ── Create Meeting modal ──────────────────────────────────────────────────────

function CreateMeetingModal({ participants, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        scheduled_at: '',
        duration_minutes: 60,
        participants: [],
    });

    function toggle(id) {
        setData('participants', data.participants.includes(id)
            ? data.participants.filter(p => p !== id)
            : [...data.participants, id]);
    }

    function submit() {
        post(route('meetings.store'), { onSuccess: onClose });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="mb-4 text-base font-semibold text-gray-900">Schedule In-Person Meeting</h3>

                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            placeholder="Meeting title"
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={data.scheduled_at}
                            onChange={e => setData('scheduled_at', e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                        {errors.scheduled_at && <p className="mt-1 text-xs text-red-500">{errors.scheduled_at}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Duration (minutes)</label>
                        <select
                            value={data.duration_minutes}
                            onChange={e => setData('duration_minutes', parseInt(e.target.value))}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        >
                            {[15, 30, 45, 60, 90, 120].map(d => (
                                <option key={d} value={d}>{d} min</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-medium text-gray-700">
                            Invite Participants
                        </label>
                        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                            {participants.length === 0 && (
                                <p className="py-2 text-center text-xs text-gray-400">No participants available.</p>
                            )}
                            {participants.map(f => (
                                <label key={f.id} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={data.participants.includes(f.id)}
                                        onChange={() => toggle(f.id)}
                                        className="rounded border-gray-300"
                                    />
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600">
                                        {initials(f.name)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-900">{f.name}</p>
                                        <p className="text-xs capitalize text-gray-400">{f.role}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.participants && <p className="mt-1 text-xs text-red-500">{errors.participants}</p>}
                    </div>
                </div>

                <div className="mt-5 flex gap-2">
                    <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing || !data.title || !data.scheduled_at || data.participants.length === 0}
                        className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                        Schedule
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Meeting card ──────────────────────────────────────────────────────────────

function MeetingCard({ meeting, currentUserId }) {
    const isCreator = meeting.created_by === currentUserId;
    const myPivot   = meeting.participants.find(p => p.id === currentUserId)?.pivot;

    return (
        <Link
            href={route('meetings.show', { meeting: meeting.id })}
            className="block rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
        >
            <div className="mb-2 flex items-start justify-between gap-2">
                <p className="font-medium text-gray-900">{meeting.title}</p>
                <StatusBadge status={meeting.status} />
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400">
                <IconCalendar />
                <span>{formatScheduled(meeting.scheduled_at)}</span>
                <span className="mx-1 text-gray-300">·</span>
                <span>{meeting.duration_minutes} min</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                    {meeting.participants.slice(0, 5).map(p => (
                        <div
                            key={p.id}
                            title={p.name}
                            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[9px] font-semibold text-gray-600"
                        >
                            {initials(p.name)}
                        </div>
                    ))}
                    {(meeting.participants_count ?? meeting.participants.length) > 5 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[9px] text-gray-500">
                            +{(meeting.participants_count ?? meeting.participants.length) - 5}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                    {isCreator && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Creator</span>
                    )}
                    {!isCreator && myPivot && (
                        <span className={`rounded-full px-2 py-0.5 ${
                            myPivot.status === 'accepted' ? 'bg-green-50 text-green-700' :
                            myPivot.status === 'declined' ? 'bg-red-50 text-red-500' :
                            'bg-amber-50 text-amber-600'
                        }`}>
                            {myPivot.status === 'accepted' ? 'Accepted' :
                             myPivot.status === 'declined' ? 'Declined' : 'Invited'}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MeetingsIndex({ mine, invited, participants }) {
    const { auth } = usePage().props;
    const currentUserId = auth.user.id;
    const canCreate = ['faculty', 'admin'].includes(auth.user.role);
    const [showCreate, setShowCreate] = useState(false);
    const [tab, setTab] = useState('upcoming');

    const upcoming = [...mine, ...invited].filter(m => ['scheduled', 'ongoing'].includes(m.status));
    const past     = [...mine, ...invited].filter(m => ['completed', 'cancelled'].includes(m.status));

    const shown = tab === 'upcoming' ? upcoming : past;

    const deduped = shown.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
    deduped.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Meetings</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {upcoming.length} upcoming · {past.length} past
                        </p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            <IconPlus /> Schedule
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Meetings" />

            {showCreate && (
                <CreateMeetingModal participants={participants} onClose={() => setShowCreate(false)} />
            )}

            <div className="p-6">
                {/* Tabs */}
                <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                    {['upcoming', 'past'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
                                tab === t
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t} ({t === 'upcoming' ? upcoming.length : past.length})
                        </button>
                    ))}
                </div>

                {deduped.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
                        <p className="text-sm text-gray-400">
                            {tab === 'upcoming'
                                ? canCreate
                                    ? 'No upcoming meetings. Click Schedule to create one.'
                                    : 'No upcoming meetings. A faculty member will invite you.'
                                : 'No past meetings yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {deduped.map(m => (
                            <MeetingCard key={m.id} meeting={m} currentUserId={currentUserId} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
