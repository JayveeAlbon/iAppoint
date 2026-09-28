import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

function IconPin() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function IconMap() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
    );
}

function IconSearch() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function LiveBadge() {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Live
        </span>
    );
}

function StatusBadge({ status }) {
    if (!status) return null;
    const isBusy = status.status === 'busy';
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isBusy ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
        }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isBusy ? 'bg-amber-500' : 'bg-green-500'}`} />
            {isBusy ? `Busy${status.catering_count > 0 ? ` · ${status.catering_count}` : ''}` : 'Available'}
        </span>
    );
}

function avatarColor(name = '') {
    const palette = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return palette[h % palette.length];
}

function FacultyCard({ member }) {
    const inits = member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const hasLocation = member.latitude !== null && member.longitude !== null;

    return (
        <div className="flex items-start gap-3.5 rounded-lg border border-gray-200 bg-white p-4">
            <div className="relative flex-shrink-0">
                {member.avatar_url ? (
                    <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="h-10 w-10 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ background: avatarColor(member.name) }}
                    >
                        {inits}
                    </div>
                )}
                {hasLocation && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                            {member.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                            {member.department}
                        </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        {member.faculty_status && <StatusBadge status={member.faculty_status} />}
                        {hasLocation && <LiveBadge />}
                    </div>
                </div>

                {member.office_location && (
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                        <IconPin />
                        {member.office_location}
                    </p>
                )}

                <div className="mt-2 flex items-center gap-3">
                    <Link
                        href={route('faculty.schedule', member.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 underline underline-offset-2 hover:text-gray-900"
                    >
                        View Schedule
                    </Link>
                    {hasLocation && (
                        <>
                            <span className="text-gray-300">·</span>
                            <Link
                                href={route('faculty.map')}
                                className="inline-flex items-center gap-1 text-xs text-gray-400 underline underline-offset-2 hover:text-gray-700"
                            >
                                View on Map
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Directory({ faculty }) {
    const [query, setQuery] = useState('');

    const filtered = faculty.filter(
        (m) =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            (m.department ?? '').toLowerCase().includes(query.toLowerCase()),
    );

    const liveCount = faculty.filter(
        (m) => m.latitude !== null && m.longitude !== null,
    ).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Faculty Directory
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {faculty.length} faculty registered
                            {liveCount > 0 && (
                                <span className="ml-2 text-green-600">
                                    · {liveCount} sharing live location
                                </span>
                            )}
                        </p>
                    </div>
                    <Link
                        href={route('faculty.map')}
                        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <IconMap />
                        View Map
                    </Link>
                </div>
            }
        >
            <Head title="Faculty Directory" />

            <div className="p-6">
                {/* Search */}
                <div className="relative mb-4 max-w-sm">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <IconSearch />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by name or department..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-12 text-center">
                        <p className="text-sm text-gray-500">
                            {faculty.length === 0
                                ? 'No faculty registered yet.'
                                : 'No results match your search.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((member) => (
                            <FacultyCard key={member.id} member={member} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
