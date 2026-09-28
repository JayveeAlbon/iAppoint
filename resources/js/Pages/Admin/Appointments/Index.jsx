import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

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

function Avatar({ name, avatarUrl, size = 8 }) {
    const px = size * 4;
    if (avatarUrl) {
        return <img src={avatarUrl} alt={name} style={{ width: px, height: px }} className="rounded-full object-cover flex-shrink-0" />;
    }
    return (
        <div
            className="flex flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ width: px, height: px, background: avatarColor(name) }}
        >
            {initials(name)}
        </div>
    );
}

const STATUS_PILL = {
    pending:   'bg-amber-50 text-amber-700',
    approved:  'bg-green-50 text-green-700',
    rejected:  'bg-red-50 text-red-500',
    completed: 'bg-gray-100 text-gray-500',
};

// ── Action modal ──────────────────────────────────────────────────────────────

function ActionModal({ appointment, action, onClose }) {
    const { data, setData, post, patch, processing } = useForm({ admin_notes: '' });

    function submit(e) {
        e.preventDefault();
        const url = action === 'approve'
            ? route('admin.appointments.approve', { appointment: appointment.id })
            : route('admin.appointments.reject', { appointment: appointment.id });

        const method = action === 'approve' ? post : patch;
        method(url, { onSuccess: onClose });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="mb-2 text-base font-semibold text-gray-900 capitalize">
                    {action} Appointment
                </h3>
                <p className="mb-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{appointment.title}</span>
                    {' — '}{appointment.student?.name} → {appointment.faculty?.name}
                </p>

                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            Admin Note (optional)
                        </label>
                        <textarea
                            value={data.admin_notes}
                            onChange={e => setData('admin_notes', e.target.value)}
                            placeholder="Add a note for the student…"
                            rows={3}
                            className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
                                action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                            }`}
                        >
                            {action === 'approve' ? 'Approve' : 'Reject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Appointment row ───────────────────────────────────────────────────────────

function AppointmentRow({ appt, onAction }) {
    return (
        <tr className="hover:bg-gray-50">
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                    <Avatar name={appt.student?.name} avatarUrl={appt.student?.avatar_url} size={8} />
                    <div>
                        <p className="text-sm font-medium text-gray-900">{appt.student?.name}</p>
                        <p className="text-xs text-gray-400">{appt.student?.course ?? 'Student'}</p>
                    </div>
                </div>
            </td>

            <td className="hidden px-5 py-3.5 md:table-cell">
                <div className="flex items-center gap-2.5">
                    <Avatar name={appt.faculty?.name} avatarUrl={appt.faculty?.avatar_url} size={8} />
                    <div>
                        <p className="text-sm font-medium text-gray-900">{appt.faculty?.name}</p>
                        <p className="text-xs text-gray-400">{appt.faculty?.department ?? '—'}</p>
                    </div>
                </div>
            </td>

            <td className="px-5 py-3.5">
                <p className="text-sm font-medium text-gray-900">{appt.title}</p>
                {appt.message && (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-gray-400">{appt.message}</p>
                )}
            </td>

            <td className="hidden px-5 py-3.5 text-xs text-gray-500 lg:table-cell">
                {formatDate(appt.requested_at)}
            </td>

            <td className="px-5 py-3.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_PILL[appt.status]}`}>
                    {appt.status}
                </span>
            </td>

            <td className="px-5 py-3.5">
                {appt.status === 'pending' && (
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => onAction(appt, 'approve')}
                            className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => onAction(appt, 'reject')}
                            className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100"
                        >
                            Reject
                        </button>
                    </div>
                )}
                {appt.admin_notes && (
                    <p className="mt-1 max-w-xs truncate text-[10px] text-gray-400">{appt.admin_notes}</p>
                )}
            </td>
        </tr>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminAppointments({ appointments, counts, filters }) {
    const [modal, setModal] = useState(null);
    const currentStatus = filters.status ?? 'pending';

    function changeStatus(s) {
        router.get(route('admin.appointments.index'), { status: s }, { preserveState: true, replace: true });
    }

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Appointments</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {counts.pending} pending approval
                    </p>
                </div>
            }
        >
            <Head title="Appointments — Admin" />

            {modal && (
                <ActionModal
                    appointment={modal.appt}
                    action={modal.action}
                    onClose={() => setModal(null)}
                />
            )}

            <div className="p-6 space-y-4">
                {/* Status filter tabs */}
                <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                    {[
                        { key: 'pending',   label: 'Pending',   count: counts.pending },
                        { key: 'approved',  label: 'Approved',  count: counts.approved },
                        { key: 'rejected',  label: 'Rejected',  count: counts.rejected },
                        { key: 'completed', label: 'Completed', count: counts.completed },
                        { key: 'all',       label: 'All',       count: null },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => changeStatus(t.key)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                currentStatus === t.key
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t.label}{t.count !== null ? ` (${t.count})` : ''}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Student</th>
                                <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Faculty</th>
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Subject</th>
                                <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Requested For</th>
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {appointments.data.map(appt => (
                                <AppointmentRow
                                    key={appt.id}
                                    appt={appt}
                                    onAction={(a, action) => setModal({ appt: a, action })}
                                />
                            ))}
                        </tbody>
                    </table>

                    {appointments.data.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-sm text-gray-400">No appointments match the selected filter.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {appointments.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {appointments.current_page} of {appointments.last_page}</span>
                        <div className="flex gap-1">
                            {appointments.links.map((link, i) => (
                                <Link key={i} href={link.url ?? '#'} preserveState
                                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                        link.active ? 'border-gray-900 bg-gray-900 text-white'
                                        : link.url ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                        : 'cursor-default border-gray-100 bg-gray-50 text-gray-300'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
