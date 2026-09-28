import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Star rating input ──────────────────────────────────────────────────────────

function StarRating({ value, onChange, readOnly = false, size = 22 }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
                const filled = n <= value;
                const Star = (
                    <svg
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill={filled ? '#F59E0B' : 'none'}
                        stroke={filled ? '#F59E0B' : '#CBD5E1'}
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    >
                        <polygon points="12 2 15 8.5 22 9.3 17 14 18.3 21 12 17.5 5.7 21 7 14 2 9.3 9 8.5 12 2" />
                    </svg>
                );
                if (readOnly) return <span key={n}>{Star}</span>;
                return (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className="transition-transform hover:scale-110"
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >
                        {Star}
                    </button>
                );
            })}
        </div>
    );
}

// ── Feedback modal ────────────────────────────────────────────────────────────

function FeedbackModal({ appointment, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        rating: 0,
        comment: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('appointments.feedback.store', { appointment: appointment.id }), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="text-base font-semibold text-gray-900">Rate your appointment</h3>
                <p className="mt-1 text-xs text-gray-500">
                    Share how it went with <span className="font-medium">{appointment.faculty?.name ?? 'the faculty'}</span>.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                        <label className="mb-2 block text-xs font-medium text-gray-700">
                            Overall rating
                        </label>
                        <StarRating value={data.rating} onChange={(n) => setData('rating', n)} />
                        {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Comment (optional)
                        </label>
                        <textarea
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            rows={4}
                            placeholder="What went well? What could be improved?"
                            className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                        {errors.comment && <p className="mt-1 text-xs text-red-500">{errors.comment}</p>}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || data.rating < 1}
                            className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                            Submit Feedback
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name = '') {
    const palette = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return palette[h % palette.length];
}

function formatDate(d) {
    return new Date(d).toLocaleString([], {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function Avatar({ name, avatarUrl, size = 10 }) {
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

const STATUS_STYLE = {
    pending:   'bg-amber-50 text-amber-700',
    approved:  'bg-green-50 text-green-700',
    rejected:  'bg-red-50 text-red-500',
    completed: 'bg-gray-100 text-gray-500',
};

function StatusBadge({ status }) {
    return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
            {status}
        </span>
    );
}

// ── Create Appointment Modal ───────────────────────────────────────────────────

function CreateModal({ faculty, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        faculty_id:   '',
        title:        '',
        message:      '',
        requested_at: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('appointments.store'), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="mb-4 text-base font-semibold text-gray-900">Request Appointment</h3>
                <p className="mb-4 text-xs text-gray-500">
                    Your request will be reviewed by the admin before it is confirmed.
                </p>

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Faculty Member</label>
                        <select
                            value={data.faculty_id}
                            onChange={e => setData('faculty_id', e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        >
                            <option value="">Select faculty…</option>
                            {faculty.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.name}{f.department ? ` — ${f.department}` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.faculty_id && <p className="mt-1 text-xs text-red-500">{errors.faculty_id}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Subject / Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            placeholder="e.g. Thesis consultation"
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Preferred Date & Time</label>
                        <input
                            type="datetime-local"
                            value={data.requested_at}
                            onChange={e => setData('requested_at', e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                        {errors.requested_at && <p className="mt-1 text-xs text-red-500">{errors.requested_at}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Message (optional)</label>
                        <textarea
                            value={data.message}
                            onChange={e => setData('message', e.target.value)}
                            placeholder="Briefly describe the purpose…"
                            rows={3}
                            className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.faculty_id || !data.title || !data.requested_at}
                            className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Student appointment card ───────────────────────────────────────────────────

function AppointmentCard({ appt, isStudent, onGiveFeedback }) {
    const person = isStudent ? appt.faculty : appt.student;
    const personLabel = isStudent ? 'Faculty' : 'Student';

    const canGiveFeedback =
        isStudent
        && !appt.feedback
        && (appt.status === 'approved' || appt.status === 'completed');

    function cancel() {
        if (!confirm('Cancel this appointment request?')) return;
        router.delete(route('appointments.destroy', { appointment: appt.id }), { preserveScroll: true });
    }

    return (
        <div className={`flex items-start gap-3 rounded-lg border bg-white p-4 ${appt.status === 'pending' ? 'border-amber-200' : 'border-gray-200'}`}>
            <Avatar
                name={person?.name ?? '?'}
                avatarUrl={person?.avatar_url}
                size={10}
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{appt.title}</p>
                        <p className="text-xs text-gray-400">
                            {personLabel}: {person?.name ?? '—'}
                            {person?.department ? ` · ${person.department}` : ''}
                        </p>
                    </div>
                    <StatusBadge status={appt.status} />
                </div>

                <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {formatDate(appt.requested_at)}
                </p>

                {appt.message && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">{appt.message}</p>
                )}

                {appt.admin_notes && (
                    <p className="mt-1.5 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
                        <span className="font-medium">Admin note:</span> {appt.admin_notes}
                    </p>
                )}

                {appt.feedback && (
                    <div className="mt-2 flex items-start gap-2 rounded bg-amber-50/50 px-2 py-1.5">
                        <StarRating value={appt.feedback.rating} readOnly size={12} />
                        {appt.feedback.comment && (
                            <p className="text-xs text-gray-600 line-clamp-2">"{appt.feedback.comment}"</p>
                        )}
                    </div>
                )}

                {canGiveFeedback && (
                    <button
                        onClick={() => onGiveFeedback(appt)}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15 8.5 22 9.3 17 14 18.3 21 12 17.5 5.7 21 7 14 2 9.3 9 8.5 12 2" />
                        </svg>
                        Rate Faculty
                    </button>
                )}
            </div>

            {isStudent && appt.status === 'pending' && (
                <button
                    onClick={cancel}
                    className="flex-shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                    Cancel
                </button>
            )}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AppointmentsIndex({ appointments, faculty, viewAs }) {
    const isStudent = viewAs === 'student';
    const [showCreate, setShowCreate] = useState(false);
    const [feedbackFor, setFeedbackFor] = useState(null);
    const [tab, setTab] = useState(isStudent ? 'pending' : 'pending');

    const byStatus = {
        pending:   appointments.filter(a => a.status === 'pending'),
        approved:  appointments.filter(a => a.status === 'approved'),
        rejected:  appointments.filter(a => a.status === 'rejected'),
        completed: appointments.filter(a => a.status === 'completed'),
    };

    const shown = tab === 'all' ? appointments : (byStatus[tab] ?? appointments);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Appointments</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {isStudent
                                ? `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`
                                : `${byStatus.pending.length} pending · ${byStatus.approved.length} confirmed`}
                        </p>
                    </div>
                    {isStudent && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Request Appointment
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Appointments" />

            {showCreate && (
                <CreateModal faculty={faculty} onClose={() => setShowCreate(false)} />
            )}

            {feedbackFor && (
                <FeedbackModal appointment={feedbackFor} onClose={() => setFeedbackFor(null)} />
            )}

            <div className="p-6">
                <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                    {['pending', 'approved', 'rejected', 'completed', 'all'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t} {t !== 'all' && `(${byStatus[t].length})`}
                        </button>
                    ))}
                </div>

                {shown.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
                        <p className="text-sm text-gray-400">
                            {isStudent
                                ? tab === 'pending' ? 'No pending appointments. Click "Request Appointment" to get started.' : `No ${tab} appointments.`
                                : `No ${tab === 'all' ? '' : tab + ' '}appointments.`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shown.map(a => (
                            <AppointmentCard
                                key={a.id}
                                appt={a}
                                isStudent={isStudent}
                                onGiveFeedback={setFeedbackFor}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
