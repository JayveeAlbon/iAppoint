import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDt(value) {
    if (!value) return '';
    return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function timeAgo(value) {
    if (!value) return '';
    const diff = Math.floor((Date.now() - new Date(value)) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Status badge (email logs) ─────────────────────────────────────────────────

const STATUS_STYLE = {
    sent:    'bg-green-50 text-green-700 ring-green-200',
    failed:  'bg-red-50 text-red-600 ring-red-200',
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
};

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'sent' ? 'bg-green-500' : status === 'failed' ? 'bg-red-500' : 'bg-amber-400'}`} />
            {status}
        </span>
    );
}

// ── Notification type dot ─────────────────────────────────────────────────────

const TYPE_COLOR = {
    'Appointment Approved':   'bg-green-500',
    'Appointment Rejected':   'bg-red-500',
    'Appointment Rescheduled':'bg-blue-500',
    'Appointment Reminder':   'bg-amber-500',
    'New Appointment Request':'bg-purple-500',
    'Appointment Invitation': 'bg-purple-500',
    'Invitation Response':    'bg-indigo-500',
    'Appointment Cancelled':  'bg-rose-500',
    'New Registration':       'bg-teal-500',
    'Pending Appointment':    'bg-amber-500',
    'Open Feedback':          'bg-orange-500',
    'Unread Message':         'bg-blue-400',
};

function TypeDot({ type }) {
    return <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${TYPE_COLOR[type] ?? 'bg-gray-400'}`} />;
}

// ── Group detail modal ────────────────────────────────────────────────────────

function GroupDetailModal({ group, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <p className="text-sm font-bold text-gray-900">{group.type}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{group.count} notification{group.count > 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                    {group.items.map((item, i) => (
                        <div key={i} className="px-6 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-xs text-gray-400">{formatDt(item.created_at)}</p>
                                    {item.read !== undefined && (
                                        <span className={`text-[10px] font-medium ${item.read ? 'text-gray-400' : 'text-blue-600'}`}>
                                            {item.read ? 'Read' : 'Unread'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-100 px-6 py-4 flex justify-between items-center">
                    <Link href={group.href} className="text-sm text-blue-600 hover:underline font-medium">
                        View related page →
                    </Link>
                    <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Email log detail modal ────────────────────────────────────────────────────

function EmailLogDetailModal({ logId, onClose }) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const { post, processing }  = useForm();

    useState(() => {
        fetch(route('admin.notification-logs.show', { notificationLog: logId }), {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(d => { setData(d.log); setLoading(false); })
            .catch(() => setLoading(false));
    });

    function handleRetry() {
        post(route('admin.notification-logs.retry', { notificationLog: logId }), {
            onSuccess: onClose,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">Email Log Details</p>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                    {loading && <p className="text-sm text-gray-400">Loading…</p>}
                    {data && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <StatusBadge status={data.status} />
                                <span className="text-xs text-gray-400">{formatDt(data.created_at)}</span>
                            </div>
                            {[
                                { label: 'Recipient', value: `${data.recipient_name} (${data.recipient_email})` },
                                { label: 'Type',      value: data.label },
                                { label: 'Subject',   value: data.email_subject },
                                data.sent_at ? { label: 'Sent at', value: formatDt(data.sent_at) } : null,
                            ].filter(Boolean).map(row => (
                                <div key={row.label} className="flex items-start gap-3">
                                    <span className="w-20 flex-shrink-0 text-xs text-gray-400">{row.label}</span>
                                    <span className="text-xs font-medium text-gray-800 break-all">{row.value}</span>
                                </div>
                            ))}
                            {data.email_preview && (
                                <div>
                                    <p className="mb-1 text-xs text-gray-400">Preview</p>
                                    <p className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">{data.email_preview}</p>
                                </div>
                            )}
                            {data.error_message && (
                                <div>
                                    <p className="mb-1 text-xs text-red-500 font-medium">Error</p>
                                    <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700 whitespace-pre-wrap">{data.error_message}</p>
                                </div>
                            )}
                            {data.appointment && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100">
                                    <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Appointment</p>
                                    {[
                                        { label: 'Subject', value: data.appointment.title },
                                        { label: 'Status',  value: data.appointment.status?.toUpperCase() },
                                        { label: 'Date',    value: formatDt(data.appointment.requested_at) },
                                        data.appointment.student ? { label: 'Student', value: `${data.appointment.student.name} (${data.appointment.student.email})` } : null,
                                        data.appointment.faculty ? { label: 'Faculty', value: data.appointment.faculty.name } : null,
                                    ].filter(Boolean).map(row => (
                                        <div key={row.label} className="flex items-start gap-3 px-3 py-2">
                                            <span className="w-16 flex-shrink-0 text-xs text-gray-400">{row.label}</span>
                                            <span className="text-xs font-medium text-gray-800 break-all">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Close</button>
                    {data?.status === 'failed' && (
                        <button onClick={handleRetry} disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                            {processing && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
                            {processing ? 'Retrying…' : 'Retry Email'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Retry inline button ───────────────────────────────────────────────────────

function RetryButton({ logId }) {
    const { post, processing } = useForm();
    return (
        <button onClick={() => post(route('admin.notification-logs.retry', { notificationLog: logId }))}
            disabled={processing}
            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
            {processing
                ? <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}
            Retry
        </button>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NotificationsIndex({
    items, filter, tab, totalUnread,
    emailLogs, logCounts, logTypes,
}) {
    const { auth, flash } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';

    const [activeTab,    setActiveTab]    = useState(tab ?? 'notifications');
    const [activeFilter, setActiveFilter] = useState(filter ?? 'all');
    const [detailGroup,  setDetailGroup]  = useState(null);
    const [detailLogId,  setDetailLogId]  = useState(null);

    const { post: markAll, processing: markingAll } = useForm();

    function applyFilter(f) {
        setActiveFilter(f);
        router.get(route('notifications.index'), { filter: f, tab: activeTab }, { preserveState: true, replace: true });
    }

    function switchTab(t) {
        setActiveTab(t);
        router.get(route('notifications.index'), { filter: activeFilter, tab: t }, { preserveState: true, replace: true });
    }

    function handleMarkAll() {
        markAll(route('notifications.mark-all-read'), {
            onSuccess: () => router.reload({ only: ['items', 'totalUnread'] }),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Notifications" />

            {detailGroup  && <GroupDetailModal    group={detailGroup} onClose={() => setDetailGroup(null)} />}
            {detailLogId  && <EmailLogDetailModal logId={detailLogId} onClose={() => setDetailLogId(null)} />}

            {/* ── Page header ── */}
            <div className="border-b border-gray-200 bg-white px-6 py-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {totalUnread > 0
                                ? `${totalUnread} unread notification${totalUnread > 1 ? 's' : ''}`
                                : 'All caught up'}
                        </p>
                    </div>
                    {totalUnread > 0 && activeTab === 'notifications' && (
                        <button
                            onClick={handleMarkAll}
                            disabled={markingAll}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {markingAll ? 'Marking…' : 'Mark all as read'}
                        </button>
                    )}
                </div>

                {/* ── Tab bar ── */}
                <div className="mt-4 flex gap-1">
                    <button
                        onClick={() => switchTab('notifications')}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'notifications'
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        In-App
                        {totalUnread > 0 && (
                            <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => switchTab('email_logs')}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'email_logs'
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            Email Logs
                            {logCounts?.failed > 0 && (
                                <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {logCounts.failed}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Flash ── */}
            {flash?.success && (
                <div className="mx-6 mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {flash.success}
                </div>
            )}

            <div className="p-6 space-y-4">

                {/* ══ IN-APP NOTIFICATIONS TAB ══ */}
                {activeTab === 'notifications' && (
                    <>
                        {/* Filter pills */}
                        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                            {['all', 'unread', 'read'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => applyFilter(f)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                        activeFilter === f
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {f === 'all' ? 'All' : f === 'unread' ? `Unread (${totalUnread})` : 'Read'}
                                </button>
                            ))}
                        </div>

                        {/* Notification list */}
                        {items.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                                <p className="text-sm text-gray-400">
                                    {activeFilter === 'unread' ? 'No unread notifications.' : 'No notifications.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${
                                            !item.read ? 'bg-blue-50/30' : ''
                                        }`}
                                    >
                                        <TypeDot type={item.type} />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                                                    {item.count > 1 && (
                                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                                            {item.count}
                                                        </span>
                                                    )}
                                                    {item.unread > 0 && (
                                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                                            {item.unread} unread
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400" title={formatDt(item.created_at)}>
                                                    {timeAgo(item.created_at)}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-sm text-gray-600">{item.description}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                                                    {item.type}
                                                </span>
                                                <Link
                                                    href={item.href}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    View →
                                                </Link>
                                                {item.count > 1 && (
                                                    <button
                                                        onClick={() => setDetailGroup(item)}
                                                        className="text-xs text-gray-500 hover:text-gray-900 hover:underline"
                                                    >
                                                        See all {item.count}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ══ EMAIL LOGS TAB (admin only) ══ */}
                {activeTab === 'email_logs' && isAdmin && emailLogs && (
                    <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                { label: 'Total',   value: logCounts.total,   color: 'border-gray-200 bg-white',        text: 'text-gray-900' },
                                { label: 'Sent',    value: logCounts.sent,    color: 'border-green-200 bg-green-50',    text: 'text-green-700' },
                                { label: 'Failed',  value: logCounts.failed,  color: 'border-red-200 bg-red-50',        text: 'text-red-600' },
                                { label: 'Pending', value: logCounts.pending, color: 'border-amber-200 bg-amber-50',    text: 'text-amber-700' },
                            ].map(({ label, value, color, text }) => (
                                <div key={label} className={`rounded-xl border p-4 ${color}`}>
                                    <p className="text-xs font-medium text-gray-500">{label}</p>
                                    <p className={`mt-1 text-2xl font-bold ${text}`}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Filter pills for email logs */}
                        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                            {[
                                { key: 'all',    label: 'All' },
                                { key: 'unread', label: `Failed (${logCounts.failed})` },
                                { key: 'read',   label: `Sent (${logCounts.sent})` },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => applyFilter(key)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        activeFilter === key
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Email log table */}
                        {emailLogs.data.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                                <p className="text-sm text-gray-400">No email logs found.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                {['Recipient', 'Type', 'Subject', 'Date & Time', 'Status', 'Action'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {emailLogs.data.map(log => (
                                                <tr key={log.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-gray-900">{log.recipient_name}</p>
                                                        <p className="text-xs text-gray-400">{log.recipient_email}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                                            {logTypes?.[log.notification_type] ?? log.notification_type}
                                                        </span>
                                                    </td>
                                                    <td className="max-w-[200px] px-4 py-3">
                                                        <p className="truncate text-xs text-gray-700">{log.email_subject}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                        {formatDt(log.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={log.status} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => setDetailLogId(log.id)}
                                                                className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
                                                            >
                                                                View
                                                            </button>
                                                            {log.status === 'failed' && <RetryButton logId={log.id} />}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {emailLogs.last_page > 1 && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Showing {emailLogs.from}–{emailLogs.to} of {emailLogs.total}</span>
                                <div className="flex gap-1">
                                    {emailLogs.links.map((link, i) => (
                                        <Link key={i} href={link.url ?? '#'} preserveState
                                            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                                link.active
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : link.url
                                                    ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                    : 'cursor-default border-gray-100 bg-gray-50 text-gray-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
