import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminDashboardOverview from '@/Components/AdminDashboardOverview';
import { Head, Link, usePage } from '@inertiajs/react';

function IconUsers() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function FacultyStatusCard({ user }) {
    const hasLocation = user.latitude !== null && user.latitude !== undefined;
    const hasConsent = !!user.location_consent_at;

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3.5">
                <p className="text-sm font-medium text-gray-900">Location Sharing</p>
                <p className="mt-0.5 text-xs text-gray-500">
                    Your location is automatically shared while you are logged in.
                </p>
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
                <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${hasLocation ? 'bg-green-500' : hasConsent ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                <p className="text-sm text-gray-700">
                    {hasLocation ? (
                        <>
                            Active —{' '}
                            <span className="font-mono text-xs text-gray-400">
                                {parseFloat(user.latitude).toFixed(5)}, {parseFloat(user.longitude).toFixed(5)}
                            </span>
                        </>
                    ) : hasConsent ? (
                        'Waiting for GPS signal…'
                    ) : (
                        'Pending your agreement to location terms.'
                    )}
                </p>
            </div>
        </div>
    );
}

function StudentQuickLinks() {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Link
                href={route('faculty.directory')}
                className="flex items-start gap-3.5 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
            >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <IconUsers />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">Find Faculty</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Browse all registered faculty members.
                    </p>
                </div>
            </Link>
        </div>
    );
}

function AppointmentApprovalNotice({ updates }) {
    if (!updates?.length) return null;

    return (
        <section className="rounded-lg border border-green-200 bg-green-50 p-4" aria-label="Appointment updates">
            <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-600" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-green-900">
                        Your appointment{updates.length > 1 ? 's have' : ' has'} been approved
                    </h2>
                    <ul className="mt-2 space-y-3">
                        {updates.map((update) => (
                            <li key={update.id} className="text-sm text-green-900">
                                <p>
                                    <span className="font-medium">{update.title}</span>
                                    {' with '}
                                    <span className="font-medium">{update.faculty}</span>
                                    {update.requested_at && (
                                        <> — {new Date(update.requested_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</>
                                    )}
                                </p>
                                {update.admin_notes && (
                                    <p className="mt-1 text-xs text-green-800">Admin note: {update.admin_notes}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={route('notifications.index')}
                        className="mt-3 inline-block text-xs font-medium text-green-800 underline hover:text-green-950"
                    >
                        View notifications
                    </Link>
                </div>
            </div>
        </section>
    );
}

function StudentAppointmentSummary({ summary, upcomingAppointments }) {
    if (!summary) return null;

    const cards = [
        {
            label: 'Upcoming Appointments',
            value: summary.upcoming,
            detail: 'Approved and scheduled',
            iconClass: 'bg-blue-50 text-blue-600',
            valueClass: 'text-blue-600',
            icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></>,
        },
        {
            label: 'Completed',
            value: summary.completedThisMonth,
            detail: 'This month',
            iconClass: 'bg-green-50 text-green-600',
            valueClass: 'text-green-600',
            icon: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
        },
        {
            label: 'Pending Requests',
            value: summary.pending,
            detail: 'Awaiting approval',
            iconClass: 'bg-amber-50 text-amber-600',
            valueClass: 'text-amber-600',
            icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
        },
        {
            label: 'Rejected Requests',
            value: summary.rejected,
            detail: 'All requests',
            iconClass: 'bg-rose-50 text-rose-600',
            valueClass: 'text-rose-600',
            icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="m9 9 6 6m0-6-6 6" /></>,
        },
    ];

    return (
        <section aria-label="Appointment summary">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <Link
                        key={card.label}
                        href={route('appointments.index')}
                        className="flex min-h-28 items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-gray-200 hover:shadow"
                    >
                        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${card.iconClass}`}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                {card.icon}
                            </svg>
                        </span>
                        <span className="min-w-0">
                            <span className={`block text-2xl font-bold leading-none ${card.valueClass}`}>{card.value}</span>
                            <span className="mt-2 block text-xs font-medium text-gray-800">{card.label}</span>
                            <span className="mt-1 block text-[11px] text-gray-500">{card.detail}</span>
                        </span>
                    </Link>
                ))}
            </div>

            {upcomingAppointments?.length > 0 && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-900">Your approved appointments</h2>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {upcomingAppointments.map((appointment) => (
                            <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                                <span>
                                    <span className="block text-sm font-medium text-gray-800">{appointment.title}</span>
                                    <span className="mt-0.5 block text-xs text-gray-500">With {appointment.faculty}</span>
                                </span>
                                {appointment.requested_at && (
                                    <time className="text-xs text-gray-500">
                                        {new Date(appointment.requested_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </time>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}

function FacultyDashboard({ user, stats, upcomingAppts }) {
    if (!stats) return null;

    const cards = [
        {
            label: 'Appointments Today',
            value: stats.appointmentsToday,
            link: route('appointments.index'),
            linkLabel: "View today's appointments",
            bg: 'bg-green-500',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    <path d="m9 16 2 2 4-4" />
                </svg>
            ),
        },
        {
            label: 'Pending Requests',
            value: stats.pendingRequests,
            link: route('appointments.index'),
            linkLabel: 'View pending',
            bg: 'bg-amber-500',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
            ),
        },
        {
            label: 'Completed',
            value: stats.completed,
            link: route('appointments.index'),
            linkLabel: 'View all appointments',
            bg: 'bg-purple-500',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" />
                </svg>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${card.bg}`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                <p className="text-xs text-gray-500">{card.label}</p>
                            </div>
                        </div>
                        <Link
                            href={card.link}
                            className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                            {card.linkLabel}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                ))}
            </div>

            {/* Upcoming appointments */}
            {upcomingAppts?.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-900">Upcoming Appointments</h2>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {upcomingAppts.map((appt) => (
                            <li key={appt.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                                <span>
                                    <span className="block text-sm font-medium text-gray-800">{appt.title}</span>
                                    <span className="mt-0.5 block text-xs text-gray-500">With {appt.student}</span>
                                </span>
                                {appt.requested_at && (
                                    <time className="text-xs text-gray-500">
                                        {new Date(appt.requested_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </time>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Location sharing card */}
            <FacultyStatusCard user={user} />
        </div>
    );
}

export default function Dashboard() {
    const { auth, reports, appointmentUpdates, appointmentSummary, upcomingAppointments, facultyStats, upcomingFacultyAppts } = usePage().props;
    const { user } = auth;
    const isFaculty = user.role === 'faculty';
    const isAdmin = user.role === 'admin';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="p-6">
                <div className="mb-4">
                    <p className="text-sm text-gray-500">
                        Welcome back,{' '}
                        <span className="font-medium text-gray-900">{user.name}</span>.
                    </p>
                </div>

                <div className="space-y-4">
                    {isFaculty && (
                        <FacultyDashboard
                            user={user}
                            stats={facultyStats}
                            upcomingAppts={upcomingFacultyAppts}
                        />
                    )}
                    {user.role === 'student' && (
                        <StudentAppointmentSummary
                            summary={appointmentSummary}
                            upcomingAppointments={upcomingAppointments}
                        />
                    )}
                    {!isAdmin && <AppointmentApprovalNotice updates={appointmentUpdates} />}
                    {!isAdmin && <StudentQuickLinks />}
                    {isAdmin && reports && <AdminDashboardOverview {...reports} />}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
