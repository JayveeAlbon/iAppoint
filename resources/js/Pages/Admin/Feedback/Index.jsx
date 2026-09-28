import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

function initials(name = '?') {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name = '') {
    const palette = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return palette[h % palette.length];
}

function Avatar({ user, size = 9 }) {
    const px = size * 4;
    if (user?.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt={user.name}
                style={{ width: px, height: px }}
                className="rounded-full object-cover flex-shrink-0"
            />
        );
    }
    return (
        <div
            className="flex flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ width: px, height: px, background: avatarColor(user?.name) }}
        >
            {initials(user?.name)}
        </div>
    );
}

const CATEGORY_STYLE = {
    bug:        'bg-red-50 text-red-700',
    suggestion: 'bg-indigo-50 text-indigo-700',
    question:   'bg-amber-50 text-amber-700',
    other:      'bg-gray-100 text-gray-600',
    general:    'bg-gray-100 text-gray-600',
};

function formatDate(d) {
    return new Date(d).toLocaleString([], {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function FeedbackRow({ item, onPreview }) {
    function resolve() {
        router.post(route('admin.feedback.resolve', { feedback: item.id }), {}, { preserveScroll: true });
    }
    function del() {
        if (!confirm('Delete this feedback permanently?')) return;
        router.delete(route('admin.feedback.destroy', { feedback: item.id }), { preserveScroll: true });
    }

    const roleLabel =
        item.user?.role === 'faculty' ? (item.user.department ?? 'Faculty') :
        item.user?.role === 'admin'   ? 'Admin' :
        (item.user?.course ?? 'Student');

    return (
        <div className={`flex items-start gap-4 rounded-lg border p-4 ${item.status === 'open' ? 'border-amber-200 bg-white' : 'border-gray-200 bg-gray-50/40'}`}>
            <Avatar user={item.user} size={10} />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{item.subject}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.other}`}>
                        {item.category}
                    </span>
                    {item.status === 'resolved' && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            resolved
                        </span>
                    )}
                </div>

                <p className="mt-0.5 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{item.user?.name ?? 'Unknown'}</span>
                    {' · '}{roleLabel}
                    {' · '}{formatDate(item.created_at)}
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.message}</p>

                {item.page_url && (
                    <p className="mt-2 truncate text-[11px] text-gray-400">
                        Page: <span className="font-mono">{item.page_url}</span>
                    </p>
                )}

                {item.screenshot_url && (
                    <div className="mt-3">
                        <button
                            onClick={() => onPreview(item.screenshot_url)}
                            className="group inline-block overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                        >
                            <img
                                src={item.screenshot_url}
                                alt="attached snapshot"
                                className="max-h-32 w-auto transition-transform group-hover:scale-[1.02]"
                            />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-shrink-0 flex-col gap-1">
                {item.status === 'open' && (
                    <button
                        onClick={resolve}
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                        Resolve
                    </button>
                )}
                <button
                    onClick={del}
                    className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

export default function AdminFeedbackIndex({ feedback, counts, filters }) {
    const [preview, setPreview] = useState(null);
    const { flash } = usePage().props;

    function setStatus(status) {
        router.get(route('admin.feedback.index'), { status }, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    const tabs = [
        { key: 'all',      label: 'All',      count: counts.total },
        { key: 'open',     label: 'Open',     count: counts.open },
        { key: 'resolved', label: 'Resolved', count: counts.resolved },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">User Feedback</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Messages, bug reports, and snapshots submitted by students and faculty.
                    </p>
                </div>
            }
        >
            <Head title="Admin — Feedback" />

            <div className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setStatus(t.key)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                    (filters.status ?? 'all') === t.key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t.label} ({t.count})
                            </button>
                        ))}
                    </div>
                </div>

                {flash?.success && (
                    <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}

                {feedback.data.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
                        <p className="text-sm text-gray-400">No feedback to show.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {feedback.data.map(f => (
                            <FeedbackRow key={f.id} item={f} onPreview={setPreview} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {feedback.links && feedback.data.length > 0 && (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
                        {feedback.links.map((l, i) => (
                            <Link
                                key={i}
                                href={l.url ?? '#'}
                                dangerouslySetInnerHTML={{ __html: l.label }}
                                className={`rounded-md border px-3 py-1 text-xs ${
                                    l.active
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : l.url
                                            ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            : 'cursor-not-allowed border-gray-100 text-gray-300'
                                }`}
                                preserveScroll
                                preserveState
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Image preview modal */}
            {preview && (
                <div
                    onClick={() => setPreview(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                >
                    <img
                        src={preview}
                        alt="snapshot preview"
                        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
