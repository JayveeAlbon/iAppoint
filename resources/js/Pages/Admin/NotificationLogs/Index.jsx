import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDt(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE = {
    sent:    'bg-green-50 text-green-700 ring-green-200',
    failed:  'bg-red-50  text-red-600   ring-red-200',
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
};

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
            {status === 'sent'    && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            {status === 'failed'  && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
            {status === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
            {status}
        </span>
    );
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }) {
    const styles = {
        gray:  'border-gray-200 bg-white',
        green: 'border-green-200 bg-green-50',
        red:   'border-red-200   bg-red-50',
        amber: 'border-amber-200 bg-amber-50',
    };
    const textStyles = {
        gray:  'text-gray-900',
        green: 'text-green-700',
        red:   'text-red-600',
        amber: 'text-amber-700',
    };
    return (
        <div className={`rounded-xl border p-4 ${styles[color]}`}>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${textStyles[color]}`}>{value}</p>
        </div>
    );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({ logId, onClose }) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const { post, processing }  = useForm();

    // Fetch on mount
    useState(() => {
        fetch(route('admin.notification-logs.show', { notificationLog: logId }), {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(d => { setData(d.log); setLoading(false); })
            .catch(() => { setError('Failed to load details.'); setLoading(false); });
    });

    function handleRetry() {
        post(route('admin.notification-logs.retry', { notificationLog: logId }), {
            onSuccess: onClose,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="text-base font-bold text-gray-900">Notification Details</h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                    {loading && <p className="text-sm text-gray-400">Loading…</p>}
                    {error   && <p className="text-sm text-red-500">{error}</p>}

                    {data && (
                        <div className="space-y-5">
                            {/* Status */}
                            <div className="flex items-center gap-3">
                                <StatusBadge status={data.status} />
                                <span className="text-xs text-gray-400">{formatDt(data.created_at)}</span>
                            </div>

                            {/* Recipient */}
                            <Section title="Recipient">
                                <Row label="Name"  value={data.recipient_name} />
                                <Row label="Email" value={data.recipient_email} />
                            </Section>

                            {/* Notification */}
                            <Section title="Notification">
                                <Row label="Type"    value={data.label} />
                                <Row label="Subject" value={data.email_subject} />
                                {data.sent_at && <Row label="Sent at" value={formatDt(data.sent_at)} />}
                            </Section>

                            {/* Email preview */}
                            {data.email_preview && (
                                <Section title="Email Preview">
                                    <p className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
                                        {data.email_preview}
                                    </p>
                                </Section>
                            )}

                            {/* Error */}
                            {data.error_message && (
                                <Section title="Error Details">
                                    <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700 whitespace-pre-wrap">
                                        {data.error_message}
                                    </p>
                                </Section>
                            )}

                            {/* Appointment */}
                            {data.appointment && (
                                <Section title="Related Appointment">
                                    <Row label="ID"      value={`#${data.appointment.id}`} />
                                    <Row label="Subject" value={data.appointment.title} />
                                    <Row label="Status"  value={data.appointment.status?.toUpperCase()} />
                                    <Row label="Date"    value={formatDt(data.appointment.requested_at)} />
                                    {data.appointment.student && (
                                        <Row label="Student" value={`${data.appointment.student.name} (${data.appointment.student.email})`} />
                                    )}
                                    {data.appointment.faculty && (
                                        <Row label="Faculty" value={`${data.appointment.faculty.name} · ${data.appointment.faculty.department ?? '—'}`} />
                                    )}
                                </Section>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
                    <button onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                        Close
                    </button>
                    {data?.status === 'failed' && (
                        <button
                            onClick={handleRetry}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                </svg>
                            )}
                            {processing ? 'Retrying…' : 'Retry Email'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{title}</p>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50">
                {children}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-start gap-3 px-3 py-2">
            <span className="w-20 flex-shrink-0 text-xs text-gray-400">{label}</span>
            <span className="text-xs font-medium text-gray-800 break-all">{value ?? '—'}</span>
        </div>
    );
}

// ── Retry button (inline in table) ────────────────────────────────────────────

function RetryButton({ logId }) {
    const { post, processing } = useForm();
    return (
        <button
            onClick={() => post(route('admin.notification-logs.retry', { notificationLog: logId }))}
            disabled={processing}
            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
            {processing
                ? <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            }
            Retry
        </button>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NotificationLogsIndex({ logs, counts, filters, types }) {
    const [detailId, setDetailId] = useState(null);

    // Local filter state mirrors URL params
    const [search,     setSearch]     = useState(filters.search     ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.type       ?? '');
    const [status,     setStatus]     = useState(filters.status     ?? '');
    const [date,       setDate]       = useState(filters.date       ?? '');
    const [sort,       setSort]       = useState(filters.sort       ?? 'newest');

    function applyFilters(overrides = {}) {
        const params = {
            search:  search,
            type:    typeFilter,
            status,
            date,
            sort,
            ...overrides,
        };
        // Strip empty values
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        router.get(route('admin.notification-logs.index'), params, { preserveState: true, replace: true });
    }

    function handleSearchKey(e) {
        if (e.key === 'Enter') applyFilters({ search: e.target.value });
    }

    // Flash messages
    const { flash } = window.__inertia_initial_page_data?.props ?? {};

    const typeOptions = Object.entries(types ?? {});
    // Deduplicate labels
    const uniqueTypes = [...new Map(typeOptions.map(([k, v]) => [v, k])).entries()].map(([v, k]) => ({ key: k, label: v }));

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Notification Logs</h2>
                    <p className="mt-0.5 text-sm text-gray-500">Monitor all email notification activity</p>
                </div>
            }
        >
            <Head title="Notification Logs — Admin" />

            {detailId && (
                <DetailModal logId={detailId} onClose={() => setDetailId(null)} />
            )}

            <div className="space-y-5 p-6">

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryCard label="Total Notifications" value={counts.total}   color="gray"  />
                    <SummaryCard label="Successfully Sent"   value={counts.sent}    color="green" />
                    <SummaryCard label="Failed"              value={counts.failed}  color="red"   />
                    <SummaryCard label="Pending"             value={counts.pending} color="amber" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
                    {/* Search */}
                    <div className="min-w-[200px] flex-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleSearchKey}
                            placeholder="Name or email…"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Type</label>
                        <select
                            value={typeFilter}
                            onChange={e => { setTypeFilter(e.target.value); applyFilters({ type: e.target.value }); }}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        >
                            <option value="">All types</option>
                            {uniqueTypes.map(({ key, label }) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</label>
                        <select
                            value={status}
                            onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        >
                            <option value="">All statuses</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => { setDate(e.target.value); applyFilters({ date: e.target.value }); }}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        />
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Sort</label>
                        <select
                            value={sort}
                            onChange={e => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </div>

                    {/* Search button */}
                    <button
                        onClick={() => applyFilters()}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Search
                    </button>

                    {/* Clear */}
                    {(search || typeFilter || status || date) && (
                        <button
                            onClick={() => {
                                setSearch(''); setTypeFilter(''); setStatus(''); setDate('');
                                router.get(route('admin.notification-logs.index'), {}, { replace: true });
                            }}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {logs.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-sm text-gray-400">No notification logs found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr className="bg-gray-50">
                                        {['ID', 'Recipient', 'Type', 'Subject', 'Date & Time', 'Status', 'Action'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.data.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 text-xs text-gray-400">#{log.id}</td>

                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{log.recipient_name}</p>
                                                <p className="text-xs text-gray-400">{log.recipient_email}</p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                                    {NotificationLog_label(log.notification_type, types)}
                                                </span>
                                            </td>

                                            <td className="max-w-[220px] px-4 py-3">
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
                                                        onClick={() => setDetailId(log.id)}
                                                        className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
                                                    >
                                                        View
                                                    </button>
                                                    {log.status === 'failed' && (
                                                        <RetryButton logId={log.id} />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                            Showing {logs.from}–{logs.to} of {logs.total} logs
                        </span>
                        <div className="flex gap-1">
                            {logs.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveState
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
            </div>
        </AuthenticatedLayout>
    );
}

// helper — resolves a type key to its human label
function NotificationLog_label(type, types) {
    if (types && types[type]) return types[type];
    return type.split('.').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
