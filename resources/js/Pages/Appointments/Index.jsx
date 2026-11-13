import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BookingCalendar from '@/Components/BookingCalendar';
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
    invited:   'bg-purple-50 text-purple-700',
    declined:  'bg-rose-50 text-rose-600',
};

function StatusBadge({ status }) {
    return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
            {status}
        </span>
    );
}

// ── Faculty invite modal ──────────────────────────────────────────────────────

function FacultyInviteModal({ students, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        student_id:   '',
        title:        '',
        message:      '',
        requested_at: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('appointments.faculty.invite'), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Invite Student</h3>
                        <p className="mt-0.5 text-xs text-gray-400">Send an appointment invitation directly to a student.</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Student <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.student_id}
                            onChange={e => setData('student_id', e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        >
                            <option value="">Select student…</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}{s.course ? ` — ${s.course}` : ''}{s.year_level ? ` ${s.year_level}` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.student_id && <p className="mt-1 text-xs text-red-500">{errors.student_id}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Subject / Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            placeholder="e.g. Thesis advisory session"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Date &amp; Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={data.requested_at}
                            onChange={e => setData('requested_at', e.target.value)}
                            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        />
                        {errors.requested_at && <p className="mt-1 text-xs text-red-500">{errors.requested_at}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Message <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={data.message}
                            onChange={e => setData('message', e.target.value)}
                            placeholder="Briefly describe the purpose…"
                            rows={3}
                            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        />
                        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.student_id || !data.title || !data.requested_at}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                            {processing && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                </svg>
                            )}
                            {processing ? 'Sending…' : 'Send Invitation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Faculty action modals ─────────────────────────────────────────────────────

function FacultyRejectModal({ appointment, onClose }) {
    const { data, setData, patch, processing } = useForm({ faculty_notes: '' });

    function submit(e) {
        e.preventDefault();
        patch(route('appointments.faculty.reject', { appointment: appointment.id }), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="mb-1 text-base font-semibold text-gray-900">Decline Appointment</h3>
                <p className="mb-4 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{appointment.title}</span>
                    {' — '}{appointment.student?.name}
                </p>
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Reason (optional)
                        </label>
                        <textarea
                            value={data.faculty_notes}
                            onChange={e => setData('faculty_notes', e.target.value)}
                            placeholder="Let the student know why..."
                            rows={3}
                            className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                            {processing && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
                            {processing ? 'Declining…' : 'Decline'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FacultyRescheduleModal({ appointment, onClose }) {
    const { data, setData, patch, processing, errors } = useForm({
        requested_at: appointment.requested_at
            ? new Date(appointment.requested_at).toISOString().slice(0, 16)
            : '',
        faculty_notes: '',
    });

    function submit(e) {
        e.preventDefault();
        patch(route('appointments.faculty.reschedule', { appointment: appointment.id }), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="mb-1 text-base font-semibold text-gray-900">Propose New Schedule</h3>
                <p className="mb-4 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{appointment.title}</span>
                    {' — '}{appointment.student?.name}
                </p>
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            New Date &amp; Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={data.requested_at}
                            onChange={e => setData('requested_at', e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                        {errors.requested_at && <p className="mt-1 text-xs text-red-500">{errors.requested_at}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Note to Student (optional)
                        </label>
                        <textarea
                            value={data.faculty_notes}
                            onChange={e => setData('faculty_notes', e.target.value)}
                            placeholder="Reason for rescheduling..."
                            rows={3}
                            className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing || !data.requested_at}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                            {processing && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
                            {processing ? 'Saving…' : 'Propose Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Faculty table row ─────────────────────────────────────────────────────────

function FacultyAppointmentRow({ appt, onReject, onReschedule }) {
    const [approving, setApproving] = useState(false);
    const canAct = appt.status === 'pending' || appt.status === 'approved';

    function facultyApprove() {
        if (!confirm('Approve this appointment?')) return;
        setApproving(true);
        router.post(route('appointments.faculty.approve', { appointment: appt.id }), {}, {
            preserveScroll: true,
            onFinish: () => setApproving(false),
        });
    }

    return (
        <tr className="hover:bg-gray-50">
            {/* Student */}
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                    <Avatar name={appt.student?.name} avatarUrl={appt.student?.avatar_url} size={8} />
                    <div>
                        <p className="text-sm font-medium text-gray-900">{appt.student?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{appt.student?.course ?? 'Student'}</p>
                    </div>
                </div>
            </td>

            {/* Subject */}
            <td className="px-5 py-3.5">
                <p className="text-sm font-medium text-gray-900">{appt.title}</p>
                {appt.message && (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-gray-400">{appt.message}</p>
                )}
            </td>

            {/* Requested For */}
            <td className="hidden px-5 py-3.5 text-xs text-gray-500 lg:table-cell">
                {formatDate(appt.requested_at)}
            </td>

            {/* Status */}
            <td className="px-5 py-3.5">
                <StatusBadge status={appt.status} />
                {appt.admin_notes && (
                    <p className="mt-1 max-w-xs truncate text-[10px] text-gray-400">{appt.admin_notes}</p>
                )}
            </td>

            {/* Action */}
            <td className="px-5 py-3.5">
                {canAct ? (
                    <div className="flex flex-wrap gap-1.5">
                        {appt.status === 'pending' && (
                            <button
                                onClick={facultyApprove}
                                disabled={approving}
                                className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 active:scale-95 transition-transform"
                            >
                                {approving
                                    ? <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                }
                                {approving ? 'Approving…' : 'Approve'}
                            </button>
                        )}
                        {/* Pending: Approve + Reject only. Approved: Reschedule only. */}
                        {appt.status === 'pending' && (
                            <button
                                onClick={() => onReject(appt)}
                                className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100 active:scale-95 transition-transform"
                            >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                Reject
                            </button>
                        )}
                        {appt.status === 'approved' && (
                            <button
                                onClick={() => onReschedule(appt)}
                                className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 active:scale-95 transition-transform"
                            >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                                </svg>
                                Reschedule
                            </button>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">—</span>
                )}
            </td>
        </tr>
    );
}

// ── Invitation response buttons (student) ────────────────────────────────────

function InviteResponseButtons({ appt }) {
    const { post: accept, processing: accepting } = useForm();
    const { post: decline, processing: declining } = useForm();

    return (
        <>
            <button
                onClick={() => accept(route('appointments.student.accept', { appointment: appt.id }), { preserveScroll: true })}
                disabled={accepting || declining}
                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
                {accepting
                    ? <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
                {accepting ? '…' : 'Accept'}
            </button>
            <button
                onClick={() => decline(route('appointments.student.decline', { appointment: appt.id }), { preserveScroll: true })}
                disabled={accepting || declining}
                className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
            >
                {declining
                    ? <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                }
                {declining ? '…' : 'Decline'}
            </button>
        </>
    );
}

// ── Student appointment card ───────────────────────────────────────────────────

function AppointmentCard({ appt, isStudent, onGiveFeedback, onFacultyReject, onFacultyReschedule }) {
    const person = isStudent ? appt.faculty : appt.student;
    const personLabel = isStudent ? 'Faculty' : 'Student';
    const [cancelling, setCancelling] = useState(false);
    const [approving, setApproving] = useState(false);

    const canGiveFeedback =
        isStudent
        && !appt.feedback
        && (appt.status === 'approved' || appt.status === 'completed');

    const canFacultyAct = !isStudent && (appt.status === 'pending' || appt.status === 'approved');

    function cancel() {
        if (!confirm('Cancel this appointment?')) return;
        setCancelling(true);
        router.delete(route('appointments.destroy', { appointment: appt.id }), {
            preserveScroll: true,
            onFinish: () => setCancelling(false),
        });
    }

    function facultyApprove() {
        if (!confirm('Approve this appointment?')) return;
        setApproving(true);
        router.post(route('appointments.faculty.approve', { appointment: appt.id }), {}, {
            preserveScroll: true,
            onFinish: () => setApproving(false),
        });
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
                            {personLabel}: {person?.name ?? '-'}
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

                {/* Faculty action buttons */}
                {canFacultyAct && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {appt.status === 'pending' && (
                            <button
                                onClick={facultyApprove}
                                disabled={approving}
                                className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 active:scale-95 transition-transform"
                            >
                                {approving
                                    ? <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                }
                                {approving ? 'Approving…' : 'Approve'}
                            </button>
                        )}
                        <button
                            onClick={() => onFacultyReject(appt)}
                            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100 active:scale-95 transition-transform"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Decline
                        </button>
                        <button
                            onClick={() => onFacultyReschedule(appt)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 active:scale-95 transition-transform"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                            </svg>
                            Reschedule
                        </button>
                    </div>
                )}
            </div>

            {isStudent && appt.status === 'pending' && (
                <button
                    onClick={cancel}
                    disabled={cancelling}
                    className="flex-shrink-0 inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                    {cancelling && (
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                        </svg>
                    )}
                    {cancelling ? 'Cancelling…' : 'Cancel'}
                </button>
            )}

            {/* Invitation response — student only */}
            {isStudent && appt.status === 'invited' && (
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <InviteResponseButtons appt={appt} />
                </div>
            )}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AppointmentsIndex({ appointments, faculty, students = [], viewAs }) {
    const isStudent = viewAs === 'student';
    const [showCreate,  setShowCreate]  = useState(false);
    const [showInvite,  setShowInvite]  = useState(false);
    const [feedbackFor, setFeedbackFor] = useState(null);
    const [tab,         setTab]         = useState('pending');
    const [rejectAppt,     setRejectAppt]     = useState(null);
    const [rescheduleAppt, setRescheduleAppt] = useState(null);

    const byStatus = {
        pending:   appointments.filter(a => a.status === 'pending'),
        approved:  appointments.filter(a => a.status === 'approved'),
        rejected:  appointments.filter(a => a.status === 'rejected'),
        completed: appointments.filter(a => a.status === 'completed'),
        invited:   appointments.filter(a => a.status === 'invited'),
        declined:  appointments.filter(a => a.status === 'declined'),
    };

    const shown = tab === 'all' ? appointments : (byStatus[tab] ?? appointments);

    // Tabs shown to students vs faculty
    const studentTabs = ['invited', 'pending', 'approved', 'rejected', 'completed', 'all'];
    const facultyTabs = ['invited', 'pending', 'approved', 'rejected', 'completed', 'all'];
    const tabs        = isStudent ? studentTabs : facultyTabs;

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
                    {!isStudent && (
                        <button
                            onClick={() => setShowInvite(true)}
                            className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.42 2 2 0 0 1 3.6 1.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.74a16 16 0 0 0 5.35 5.35l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            Invite Student
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Appointments" />

            {showCreate && (
                <BookingCalendar faculty={faculty} onClose={() => setShowCreate(false)} />
            )}

            {showInvite && (
                <FacultyInviteModal students={students} onClose={() => setShowInvite(false)} />
            )}

            {feedbackFor && (
                <FeedbackModal appointment={feedbackFor} onClose={() => setFeedbackFor(null)} />
            )}

            {rejectAppt && (
                <FacultyRejectModal appointment={rejectAppt} onClose={() => setRejectAppt(null)} />
            )}

            {rescheduleAppt && (
                <FacultyRescheduleModal appointment={rescheduleAppt} onClose={() => setRescheduleAppt(null)} />
            )}

            <div className="p-6">
                <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                    {tabs.map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`relative rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t}
                            {t !== 'all' && byStatus[t]?.length > 0 && (
                                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                    t === 'invited' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {byStatus[t].length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {shown.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
                        <p className="text-sm text-gray-400">
                            {isStudent
                                ? tab === 'invited'  ? 'No pending invitations from faculty.'
                                : tab === 'pending'  ? 'No pending appointments. Click "Request Appointment" to get started.'
                                : `No ${tab} appointments.`
                                : tab === 'invited'  ? 'No invitations sent yet. Click "Invite Student" to send one.'
                                : `No ${tab === 'all' ? '' : tab + ' '}appointments.`}
                        </p>
                    </div>
                ) : isStudent ? (
                    <div className="space-y-3">
                        {shown.map(a => (
                            <AppointmentCard
                                key={a.id}
                                appt={a}
                                isStudent={true}
                                onGiveFeedback={setFeedbackFor}
                                onFacultyReject={setRejectAppt}
                                onFacultyReschedule={setRescheduleAppt}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Student</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Subject</th>
                                    <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Requested For</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {shown.map(a => (
                                    <FacultyAppointmentRow
                                        key={a.id}
                                        appt={a}
                                        onReject={setRejectAppt}
                                        onReschedule={setRescheduleAppt}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
