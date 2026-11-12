import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

const SYSTEM_TYPES = [
    'System Performance',
    'UI/UX Issue',
    'Bug Report',
    'Feature Request',
    'Login/Access Issue',
    'Notification Issue',
    'Other System Issue',
];

const SERVICE_CATEGORIES = [
    'Appointment Scheduling',
    'Faculty Response',
    'Admin Support',
    'Notification Service',
    'Profile Management',
    'Other Service',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function FileUploadBox({ label, accept, onChange, file, hint }) {
    const ref = useRef(null);
    return (
        <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">{label}</p>
            <div
                onClick={() => ref.current?.click()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center hover:border-gray-400 hover:bg-gray-100 transition-colors"
            >
                <input ref={ref} type="file" accept={accept} className="hidden" onChange={onChange} />
                <svg className="mx-auto mb-2 h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                {file ? (
                    <p className="text-sm font-medium text-blue-600">{file.name}</p>
                ) : (
                    <>
                        <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                        <p className="mt-1 text-xs text-gray-400">{hint}</p>
                    </>
                )}
            </div>
        </div>
    );
}

function FeedbackForm({ tab }) {
    const isSystem = tab === 'system';
    const screenshotRef = useRef(null);
    const documentRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        feedback_tab: tab,
        category:     '',
        priority:     'Medium',
        subject:      isSystem ? 'System Performance Feedback' : '',
        message:      '',
        suggestions:  '',
        screenshot:   null,
        document:     null,
        page_url:     typeof window !== 'undefined' ? window.location.href : '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('student.feedback.store'), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            {/* Category / Type */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {isSystem ? 'Feedback Type' : 'Service Category'} <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.category}
                    onChange={e => setData('category', e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="">{isSystem ? 'Select feedback type' : 'Select a service'}</option>
                    {(isSystem ? SYSTEM_TYPES : SERVICE_CATEGORIES).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>

            {/* Priority */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Priority <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.priority}
                    onChange={e => setData('priority', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            {/* Subject */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Subject <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.subject}
                    onChange={e => setData('subject', e.target.value)}
                    placeholder={isSystem ? 'System Performance Feedback' : 'e.g. Library Service Feedback'}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
            </div>

            {/* Feedback Details */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Feedback Details <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={data.message}
                    onChange={e => setData('message', e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder={isSystem ? 'Please describe the issue or your feedback in detail...' : 'Please describe your feedback about the service...'}
                    required
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-right text-xs text-gray-400">{data.message.length} / 1000</p>
                {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
            </div>

            {/* Suggestions */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Suggestions for Improvement
                </label>
                <textarea
                    value={data.suggestions}
                    onChange={e => setData('suggestions', e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={isSystem ? 'Share your suggestions to improve the system performance...' : 'Share your suggestions to improve the service...'}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-right text-xs text-gray-400">{(data.suggestions || '').length} / 1000</p>
            </div>

            {/* File upload */}
            {isSystem ? (
                <FileUploadBox
                    label="Attach Screenshot (Optional)"
                    accept="image/png,image/jpg,image/jpeg,image/gif"
                    hint="PNG, JPG, GIF up to 5MB"
                    file={data.screenshot}
                    onChange={e => setData('screenshot', e.target.files[0] || null)}
                />
            ) : (
                <FileUploadBox
                    label="Attach Document (Optional)"
                    accept="image/png,image/jpg,image/jpeg,image/gif,application/pdf"
                    hint="PNG, JPG, GIF, PDF up to 5MB"
                    file={data.document}
                    onChange={e => setData('document', e.target.files[0] || null)}
                />
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={processing || !data.category || !data.subject || !data.message}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {processing ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                            </svg>
                            Submitting…
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                            Submit Feedback
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

export default function StudentFeedback({ feedbacks }) {
    const [activeTab, setActiveTab] = useState('system');

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">My Feedback Status</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Provide separate feedback for system and services to help us improve better.
                    </p>
                </div>
            }
        >
            <Head title="Feedback" />

            <div className="p-6">
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Left — form */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Header card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Provide Feedback</p>
                                    <p className="mt-0.5 text-sm text-gray-500">Share your feedback about the system and services.</p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 flex items-start gap-2">
                                <svg className="mt-0.5 flex-shrink-0 text-blue-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-blue-700">Help Us Improve</p>
                                    <p className="text-xs text-blue-600 mt-0.5">Your feedback will help the admin team identify issues and improve both the system and services for a better experience.</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs + Form */}
                        <div className="rounded-xl border border-gray-200 bg-white">
                            {/* Tab buttons */}
                            <div className="flex border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('system')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'system'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                                    </svg>
                                    System Feedback
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('services')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'services'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                    Services Feedback
                                </button>
                            </div>

                            <div className="p-5">
                                <FeedbackForm key={activeTab} tab={activeTab} />
                            </div>
                        </div>
                    </div>

                    {/* Right — info panel */}
                    <div className="space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                            <div className="mb-4 flex justify-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                                    </svg>
                                </div>
                            </div>
                            <h3 className="mb-2 text-center text-base font-semibold text-gray-900">Your Feedback Matters</h3>
                            <p className="mb-4 text-center text-xs text-gray-500">
                                Your feedback helps us ensure the system and services run smoothly and meet your needs.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Your feedback is confidential and will be used only for improvement.',
                                    'The admin team will review your feedback and take necessary actions.',
                                    'You will be notified about the updates (if applicable).',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                                        <svg className="mt-0.5 flex-shrink-0 text-blue-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recent feedback */}
                        {feedbacks?.length > 0 && (
                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <p className="mb-3 text-sm font-semibold text-gray-900">Recent Submissions</p>
                                <ul className="space-y-2">
                                    {feedbacks.slice(0, 3).map(f => (
                                        <li key={f.id} className="rounded-lg bg-gray-50 px-3 py-2">
                                            <p className="text-xs font-medium text-gray-800 truncate">{f.subject}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                                    f.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>{f.status}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(f.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
