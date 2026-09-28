import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function AdminSettings() {
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

            <div className="p-6">
                {/* System info panel */}
                <div className="mb-4 rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900">System Information</p>
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

                <div className="rounded-lg border border-dashed border-gray-200 bg-white p-12 text-center">
                    <p className="text-sm font-medium text-gray-700">Advanced Settings coming soon</p>
                    <p className="mt-1 text-xs text-gray-400">
                        Configurable system preferences, notification settings, and integrations will be available here.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
