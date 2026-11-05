import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

function formatTime(value) {
    if (!value) return '';

    return new Date(value).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function NotificationsIndex({ items }) {
    return (
        <AuthenticatedLayout>
            <Head title="Notifications" />

            <div className="border-b border-gray-200 bg-white px-6 py-5">
                <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {items.length === 1 ? '1 item needs your attention' : `${items.length} items need your attention`}
                </p>
            </div>

            <div className="p-6">
                {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                        <p className="text-sm text-gray-500">You&apos;re all caught up.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        {items.map((item, index) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${
                                    index > 0 ? 'border-t border-gray-100' : ''
                                }`}
                            >
                                <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
                                <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                                        <span className="text-sm font-medium text-gray-900">{item.title}</span>
                                        <time className="text-xs text-gray-400">{formatTime(item.created_at)}</time>
                                    </span>
                                    <span className="mt-1 block text-sm text-gray-600">{item.description}</span>
                                    <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                                        {item.type}
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
