import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconArrow() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

function IconPlay() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

function IconStop() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
    );
}

function IconMapPin() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatScheduled(dateStr) {
    return new Date(dateStr).toLocaleString([], {
        weekday: 'long', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const STATUS_PILL = {
    scheduled: 'bg-blue-50 text-blue-700',
    ongoing:   'bg-green-50 text-green-700',
    completed: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-50 text-red-500',
};

const STATUS_LABEL = {
    scheduled: 'Scheduled',
    ongoing:   'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

// ── Participant row ────────────────────────────────────────────────────────────

function ParticipantRow({ user, pivot, isPresent }) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="relative flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
                    {initials(user.name)}
                </div>
                {isPresent && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs capitalize text-gray-400">
                    {user.role}{user.department ? ` · ${user.department}` : ''}
                </p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                pivot.status === 'accepted' ? 'bg-green-50 text-green-700' :
                pivot.status === 'declined' ? 'bg-red-50 text-red-500'    :
                'bg-amber-50 text-amber-600'
            }`}>
                {pivot.status === 'accepted' ? 'Accepted' :
                 pivot.status === 'declined' ? 'Declined' : 'Pending'}
            </span>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MeetingShow({ meeting, currentUser }) {
    const isCreator      = meeting.created_by === currentUser.id;
    const myPivot        = meeting.participants.find(p => p.id === currentUser.id)?.pivot;
    const activeSessions = (meeting.catering_sessions ?? []).filter(s => !s.ended_at);
    const presentIds     = activeSessions.map(s => s.student_id);

    useEffect(() => {
        if (meeting.status !== 'ongoing') return;
        const id = setInterval(() => {
            router.reload({ only: ['meeting'] });
        }, 10_000);
        return () => clearInterval(id);
    }, [meeting.status]);

    function updateStatus(status) {
        router.patch(route('meetings.status', { meeting: meeting.id }), { status }, { preserveScroll: true });
    }

    function respond(response) {
        router.patch(route('meetings.respond', { meeting: meeting.id }), { response }, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('meetings.index')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700">
                        <IconArrow /> Meetings
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">{meeting.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_PILL[meeting.status]}`}>
                        {STATUS_LABEL[meeting.status]}
                    </span>
                </div>
            }
        >
            <Head title={meeting.title} />

            <div className="space-y-4 p-6">
                {/* Meeting info card */}
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="grid gap-5 sm:grid-cols-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date & Time</p>
                            <p className="mt-1 text-sm font-medium text-gray-800">{formatScheduled(meeting.scheduled_at)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Duration</p>
                            <p className="mt-1 text-sm font-medium text-gray-800">{meeting.duration_minutes} minutes</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Organizer</p>
                            <p className="mt-1 text-sm font-medium text-gray-800">{meeting.creator.name}</p>
                        </div>
                    </div>

                    {/* In-progress banner */}
                    {meeting.status === 'ongoing' && (
                        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-green-50 px-4 py-3">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            <p className="text-sm font-medium text-green-800">
                                Meeting in progress — {activeSessions.length} attendee{activeSessions.length !== 1 ? 's' : ''} present
                            </p>
                        </div>
                    )}

                    {/* Meeting reference code */}
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-3">
                        <IconMapPin />
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Meeting Reference</p>
                            <p className="font-mono text-base font-bold tracking-widest text-gray-800">{meeting.room_code}</p>
                        </div>
                    </div>
                </div>

                {/* Organizer controls */}
                {isCreator && ['scheduled', 'ongoing'].includes(meeting.status) && (
                    <div className="flex flex-wrap gap-2">
                        {meeting.status === 'scheduled' && (
                            <button
                                onClick={() => updateStatus('ongoing')}
                                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                            >
                                <IconPlay /> Start Meeting
                            </button>
                        )}
                        {meeting.status === 'ongoing' && (
                            <button
                                onClick={() => confirm('End this meeting for everyone?') && updateStatus('completed')}
                                className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
                            >
                                <IconStop /> End Meeting
                            </button>
                        )}
                        <button
                            onClick={() => confirm('Cancel this meeting?') && updateStatus('cancelled')}
                            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm text-red-500 hover:bg-red-50"
                        >
                            Cancel Meeting
                        </button>
                    </div>
                )}

                {/* Invitee response prompt */}
                {!isCreator && myPivot?.status === 'invited' && meeting.status === 'scheduled' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="mb-3 text-sm font-medium text-amber-900">
                            You have been invited to this in-person meeting.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => respond('accepted')}
                                className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => respond('declined')}
                                className="rounded-xl border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                )}

                {/* Participants */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">
                            Attendees
                            <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                {meeting.participants.length}
                            </span>
                        </p>
                    </div>
                    <div className="divide-y divide-gray-100 px-5">
                        {meeting.participants.length === 0 ? (
                            <p className="py-5 text-sm text-gray-400">No participants yet.</p>
                        ) : (
                            meeting.participants.map(p => (
                                <ParticipantRow
                                    key={p.id}
                                    user={p}
                                    pivot={p.pivot}
                                    isPresent={presentIds.includes(p.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
