import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function IconMap() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

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

            <Link
                href={route('faculty.map')}
                className="flex items-start gap-3.5 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
            >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    <IconMap />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">Faculty Map</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                        See where faculty are on campus right now.
                    </p>
                </div>
            </Link>
        </div>
    );
}

export default function Dashboard() {
    const { auth } = usePage().props;
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
                    {isFaculty && <FacultyStatusCard user={user} />}
                    {!isAdmin && <StudentQuickLinks />}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
