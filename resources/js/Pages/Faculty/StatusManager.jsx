import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconPlay() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

function IconStop() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
    );
}

function IconUserPlus() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
        </svg>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name = '') {
    const palette = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return palette[h % palette.length];
}

function elapsed(started) {
    const secs = Math.floor((Date.now() - new Date(started).getTime()) / 1000);
    const mins  = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
}

function fmtDate(d) {
    return new Date(d).toLocaleString([], {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function StudentAvatar({ name, avatarUrl, size = 9 }) {
    const px = size * 4;
    if (avatarUrl) {
        return (
            <img src={avatarUrl} alt={name}
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

// ── Walk-in modal ──────────────────────────────────────────────────────────────

function WalkinModal({ students, onClose }) {
    const [query, setQuery] = useState('');
    const { data, setData, post, processing } = useForm({ student_id: 0 });

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="mb-1 text-base font-semibold text-gray-900">Walk-in Session</h3>
                <p className="mb-4 text-xs text-gray-400">Select a student who walked in without an appointment.</p>

                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search student by name..."
                    className="mb-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />

                <div className="mb-4 max-h-48 space-y-1 overflow-y-auto">
                    {filtered.map(s => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50">
                            <input
                                type="radio"
                                name="student"
                                value={s.id}
                                checked={data.student_id === s.id}
                                onChange={() => setData('student_id', s.id)}
                                className="border-gray-300"
                            />
                            <StudentAvatar name={s.name} avatarUrl={s.avatar_url} size={7} />
                            <div>
                                <p className="text-sm text-gray-900">{s.name}</p>
                                <p className="text-xs text-gray-400">
                                    {s.course ?? 'Student'}{s.year_level ? ` · ${s.year_level}` : ''}
                                </p>
                            </div>
                        </label>
                    ))}
                    {filtered.length === 0 && (
                        <p className="py-3 text-center text-xs text-gray-400">No students found.</p>
                    )}
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={() => post(route('catering.start'), { onSuccess: onClose, preserveScroll: true })}
                        disabled={processing || !data.student_id}
                        className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                        Start
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Quick-start button for an appointment ─────────────────────────────────────

function StartFromAppointmentBtn({ appointment }) {
    const { post, processing } = useForm({ student_id: appointment.student_id });

    return (
        <button
            onClick={() => post(route('catering.start'), { preserveScroll: true })}
            disabled={processing}
            className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
            <IconPlay /> Cater
        </button>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StatusManager({
    facultyStatus,
    activeSessions,
    approvedAppointments,
    cateringStudentIds,
    students,
}) {
    const [showWalkin, setShowWalkin] = useState(false);
    const [tick, setTick] = useState(0);

    // Re-render elapsed timers every 30s
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 30_000);
        return () => clearInterval(id);
    }, []);

    const isBusy = facultyStatus?.status === 'busy';
    const count  = facultyStatus?.catering_count ?? 0;

    // Appointments not already in an active catering session
    const pendingAppointments = approvedAppointments.filter(
        a => !cateringStudentIds.includes(a.student_id)
    );

    function endSession(id) {
        router.delete(route('catering.end', { session: id }), { preserveScroll: true });
    }

    function clearAll() {
        if (!confirm('End all active sessions?')) return;
        router.delete(route('catering.clear'), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">My Status</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Manage your availability and catering sessions.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowWalkin(true)}
                        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <IconUserPlus /> Walk-in
                    </button>
                </div>
            }
        >
            <Head title="My Status" />

            {showWalkin && (
                <WalkinModal students={students} onClose={() => setShowWalkin(false)} />
            )}

            <div className="space-y-4 p-6">
                {/* ── Status banner ───────────────────────────────────────── */}
                <div className={`rounded-xl border p-5 ${isBusy ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                    <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${isBusy ? 'bg-amber-400' : 'bg-green-500'}`}>
                            {isBusy ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            )}
                        </span>
                        <div>
                            <p className={`text-lg font-bold ${isBusy ? 'text-amber-800' : 'text-green-800'}`}>
                                {isBusy ? `Busy — catering ${count} student${count !== 1 ? 's' : ''}` : 'Available'}
                            </p>
                            <p className={`text-xs ${isBusy ? 'text-amber-600' : 'text-green-600'}`}>
                                {isBusy
                                    ? 'Your status is visible as busy in the Faculty Directory.'
                                    : 'Students can see you are available for consultation.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Active catering sessions ─────────────────────────── */}
                {activeSessions.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                            <p className="text-sm font-semibold text-gray-900">
                                Now Catering
                                <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    {activeSessions.length}
                                </span>
                            </p>
                            <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600">
                                End All
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {activeSessions.map(session => (
                                <div key={session.id} className="flex items-center gap-3 px-5 py-3.5">
                                    <StudentAvatar
                                        name={session.student.name}
                                        avatarUrl={session.student.avatar_url}
                                        size={9}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900">{session.student.name}</p>
                                        <p className="text-xs text-gray-400">
                                            {session.student.course ?? 'Student'}
                                            {session.student.year_level ? ` · ${session.student.year_level}` : ''}
                                            <span className="mx-1.5 text-gray-300">·</span>
                                            <span className="text-amber-600">
                                                {elapsed(session.started_at)} active
                                            </span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => endSession(session.id)}
                                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <IconStop /> Done
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Approved appointments ────────────────────────────── */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">
                            Approved Appointments
                            <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                {approvedAppointments.length}
                            </span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Click "Cater" when the student arrives to mark yourself as busy.
                        </p>
                    </div>

                    {approvedAppointments.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-400">No approved appointments yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {approvedAppointments.map(appt => {
                                const isActive = cateringStudentIds.includes(appt.student_id);
                                return (
                                    <div key={appt.id} className={`flex items-center gap-3 px-5 py-3.5 ${isActive ? 'bg-amber-50/50' : ''}`}>
                                        <StudentAvatar
                                            name={appt.student.name}
                                            avatarUrl={appt.student.avatar_url}
                                            size={9}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {appt.student.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {appt.title}
                                                <span className="mx-1.5 text-gray-300">·</span>
                                                {fmtDate(appt.requested_at)}
                                            </p>
                                        </div>
                                        {isActive ? (
                                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                                Active
                                            </span>
                                        ) : (
                                            <StartFromAppointmentBtn appointment={appt} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
