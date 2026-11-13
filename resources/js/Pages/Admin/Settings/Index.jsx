import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function AdminSettings({ isAlsoFaculty }) {
    const { flash } = usePage().props;
    const { post, processing } = useForm();

    function toggleFacultyMode() {
        post(route('admin.settings.toggle-faculty-mode'));
    }

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
                    <p className="mt-0.5 text-sm text-gray-500">System configuration.</p>
                </div>
            }
        >
            <Head title="Settings — Admin" />

            <div className="space-y-5 p-6">

                {/* Flash message */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}

                {/* Faculty Mode card */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">Faculty Mode</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                            When enabled, your admin account also acts as a faculty member. Students can book appointments with you, and you can manage your own schedule and send student invitations.
                        </p>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                        <div>
                            <p className="text-sm font-medium text-gray-800">
                                Faculty Mode is currently{' '}
                                <span className={isAlsoFaculty ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                    {isAlsoFaculty ? 'ENABLED' : 'DISABLED'}
                                </span>
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                                {isAlsoFaculty
                                    ? 'You appear in the student booking calendar and have My Appointments + My Schedule in the sidebar.'
                                    : 'Enable to allow students to book appointments with you as a faculty member.'}
                            </p>
                        </div>
                        <button
                            onClick={toggleFacultyMode}
                            disabled={processing}
                            className={`ml-6 flex-shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                                isAlsoFaculty
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {processing && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                </svg>
                            )}
                            {isAlsoFaculty ? 'Disable Faculty Mode' : 'Enable Faculty Mode'}
                        </button>
                    </div>

                    {isAlsoFaculty && (
                        <div className="border-t border-gray-100 bg-blue-50/40 px-5 py-3">
                            <p className="text-xs text-blue-700 font-medium mb-1.5">Faculty Mode is active. You now have access to:</p>
                            <ul className="space-y-1 text-xs text-blue-600">
                                <li className="flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    My Appointments — manage student bookings addressed to you
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    My Schedule — configure your weekly availability
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Invite Student — send appointment invitations directly to students
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Visible in student booking calendar
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* System info */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">System Information</p>
                    </div>
                    <div className="divide-y divide-gray-100 px-5">
                        {[
                            { label: 'Application', value: 'iAppoint' },
                            { label: 'Institution', value: 'Southern Christian College, Midsayap, Cotabato' },
                            { label: 'Version',     value: '1.0.0' },
                            { label: 'Framework',   value: 'Laravel 12 + Inertia.js + React' },
                        ].map(row => (
                            <div key={row.label} className="flex items-center justify-between py-3">
                                <p className="text-sm text-gray-500">{row.label}</p>
                                <p className="text-sm font-medium text-gray-900">{row.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
