import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmt(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${period}`;
}

function IconPin() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
    );
}
function IconMap() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
        </svg>
    );
}
function IconBack() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

export default function FacultySchedule({ faculty, schedules, today }) {
    const initials = faculty.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const grouped = DAYS.reduce((acc, day) => {
        acc[day] = schedules.filter((s) => s.day === day);
        return acc;
    }, {});

    const todayEntries = grouped[today] ?? [];
    const hasLocation = faculty.latitude !== null && faculty.latitude !== undefined;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('faculty.directory')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                    >
                        <IconBack /> Directory
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm text-gray-700">{faculty.name}</span>
                </div>
            }
        >
            <Head title={`${faculty.name} — Schedule`} />

            <div className="p-6">
                {/* Faculty info card */}
                <div className="mb-6 flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-base font-semibold text-gray-700">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">{faculty.name}</h1>
                        <p className="text-sm text-gray-500">{faculty.department}</p>
                        {faculty.office_location && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                <IconPin /> {faculty.office_location}
                            </p>
                        )}
                    </div>
                    {hasLocation && (
                        <Link
                            href={route('faculty.map')}
                            className="flex flex-shrink-0 items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                            <IconMap /> View on Map
                        </Link>
                    )}
                </div>

                {/* Today's schedule highlight */}
                {todayEntries.length > 0 && (
                    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Today — {today}
                            </p>
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        </div>
                        <div className="space-y-2">
                            {todayEntries.map((entry) => (
                                <div key={entry.id} className="flex items-start gap-3 rounded-md bg-gray-50 px-3.5 py-2.5">
                                    <div className="min-w-[90px] flex-shrink-0 text-right">
                                        <p className="text-xs font-medium text-gray-700">{fmt(entry.start_time)}</p>
                                        <p className="text-[10px] text-gray-400">— {fmt(entry.end_time)}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{entry.subject}</p>
                                        {entry.room && <p className="mt-0.5 text-xs text-gray-400">{entry.room}</p>}
                                        {entry.description && <p className="mt-1 text-xs text-gray-400">{entry.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Full weekly schedule */}
                <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Weekly Schedule
                    </p>

                    {DAYS.map((day) => {
                        const entries = grouped[day];
                        const isToday = day === today;
                        return (
                            <div key={day}>
                                <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {day}{isToday && ' (Today)'}
                                </p>

                                {entries.length === 0 ? (
                                    <p className="rounded-md border border-dashed border-gray-100 py-2.5 text-center text-xs text-gray-300">
                                        No classes
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {entries.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="flex items-start gap-3 rounded-md border border-gray-100 bg-white px-3.5 py-2.5"
                                            >
                                                <div className="min-w-[90px] flex-shrink-0 text-right">
                                                    <p className="text-xs font-medium text-gray-700">{fmt(entry.start_time)}</p>
                                                    <p className="text-[10px] text-gray-400">— {fmt(entry.end_time)}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{entry.subject}</p>
                                                    {entry.room && <p className="mt-0.5 text-xs text-gray-400">{entry.room}</p>}
                                                    {entry.description && <p className="mt-1 text-xs text-gray-400">{entry.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {schedules.length === 0 && (
                        <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center">
                            <p className="text-sm text-gray-400">This faculty has not added a schedule yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
