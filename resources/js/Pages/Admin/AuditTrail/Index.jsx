import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

// ── Event badge ────────────────────────────────────────────────────────────────

const EVENT_STYLE = {
    'user.registered': 'bg-blue-50 text-blue-700',
    'user.approved':   'bg-green-50 text-green-700',
    'user.rejected':   'bg-red-50 text-red-500',
    'user.updated':    'bg-purple-50 text-purple-700',
    'user.deleted':    'bg-red-50 text-red-500',
    'user.login':      'bg-gray-100 text-gray-500',
};

function EventBadge({ event }) {
    const cls = EVENT_STYLE[event] ?? 'bg-gray-100 text-gray-500';
    const label = event.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
            {label}
        </span>
    );
}

function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatDateTime(d) {
    return new Date(d).toLocaleString([], {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AuditTrail({ logs, filters, eventGroups }) {
    const [q, setQ]         = useState(filters.q ?? '');
    const [event, setEvent] = useState(filters.event ?? '');
    const [from, setFrom]   = useState(filters.from ?? '');
    const [to, setTo]       = useState(filters.to ?? '');

    function apply(overrides = {}) {
        router.get(route('admin.audit.index'), {
            q, event, from, to, ...overrides,
        }, { preserveState: true, replace: true });
    }

    function clear() {
        setQ(''); setEvent(''); setFrom(''); setTo('');
        router.get(route('admin.audit.index'), {}, { preserveState: true, replace: true });
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Audit Trail</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {logs.total} event{logs.total !== 1 ? 's' : ''} recorded
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Audit Trail — Admin" />

            <div className="p-6 space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <input type="text" value={q} onChange={e => setQ(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && apply()}
                        placeholder="Search by user name…"
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        style={{ minWidth: 200 }} />

                    <select value={event} onChange={e => { setEvent(e.target.value); apply({ event: e.target.value }); }}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none">
                        <option value="">All Events</option>
                        {(eventGroups ?? []).map(g => (
                            <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)} events</option>
                        ))}
                    </select>

                    <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none" />
                    <span className="flex items-center text-gray-400 text-sm">to</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none" />

                    <button onClick={() => apply()}
                        className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Filter
                    </button>
                    {(q || event || from || to) && (
                        <button onClick={clear}
                            className="rounded-md px-3 py-2 text-sm text-gray-400 hover:text-gray-700">
                            Clear
                        </button>
                    )}
                </div>

                {/* Log table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Timestamp</th>
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Performed By</th>
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Event</th>
                                <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Subject</th>
                                <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Details</th>
                                <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 xl:table-cell">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.data.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-gray-500">
                                        {formatDateTime(log.created_at)}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {log.causer ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600">
                                                    {initials(log.causer.name)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-900">{log.causer.name}</p>
                                                    <p className="text-[10px] capitalize text-gray-400">{log.causer.role}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">System</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <EventBadge event={log.event} />
                                    </td>
                                    <td className="hidden px-5 py-3.5 text-xs text-gray-500 md:table-cell">
                                        {log.subject_type
                                            ? <span>{log.subject_type} #{log.subject_id}</span>
                                            : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="hidden px-5 py-3.5 lg:table-cell">
                                        {log.properties ? (
                                            <div className="max-w-xs space-y-0.5">
                                                {Object.entries(log.properties).slice(0, 3).map(([k, v]) => (
                                                    typeof v !== 'object' && (
                                                        <p key={k} className="truncate text-[10px] text-gray-500">
                                                            <span className="font-medium text-gray-700">{k}:</span>{' '}
                                                            {String(v)}
                                                        </p>
                                                    )
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="hidden px-5 py-3.5 text-[10px] font-mono text-gray-400 xl:table-cell">
                                        {log.ip ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.data.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-sm text-gray-400">No audit events match the selected filters.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {logs.current_page} of {logs.last_page} · {logs.total} events</span>
                        <div className="flex gap-1">
                            {logs.links.map((link, i) => (
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
