import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

function IconPlus() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
    );
}
function IconTrash() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
    );
}

function EnrolledSubjectsSection({ enrolledSubjects }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        subject_code: '',
        subject_name: '',
        instructor:   '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('profile.subjects.store'), {
            onSuccess: () => { reset(); setShowForm(false); },
        });
    }

    function removeSubject(id) {
        if (!confirm('Remove this subject?')) return;
        router.delete(route('profile.subjects.destroy', id), { preserveScroll: true });
    }

    return (
        <section>
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">Enrolled Subjects</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Add the subjects you are currently enrolled in.
                    </p>
                </div>
                {!showForm && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                    >
                        <IconPlus /> Add Subject
                    </button>
                )}
            </header>

            {showForm && (
                <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Subject Code <span className="text-gray-400">(optional)</span></label>
                            <input type="text" value={data.subject_code}
                                onChange={e => setData('subject_code', e.target.value)}
                                placeholder="e.g. CS101"
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
                            {errors.subject_code && <p className="mt-1 text-xs text-red-500">{errors.subject_code}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Subject Name <span className="text-red-500">*</span></label>
                            <input type="text" value={data.subject_name}
                                onChange={e => setData('subject_name', e.target.value)}
                                placeholder="e.g. Data Structures"
                                required
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
                            {errors.subject_name && <p className="mt-1 text-xs text-red-500">{errors.subject_name}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Instructor <span className="text-gray-400">(optional)</span></label>
                            <input type="text" value={data.instructor}
                                onChange={e => setData('instructor', e.target.value)}
                                placeholder="e.g. Dr. Juan Cruz"
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
                            {errors.instructor && <p className="mt-1 text-xs text-red-500">{errors.instructor}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={processing || !data.subject_name}
                            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
                            {processing ? 'Adding…' : 'Add'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {enrolledSubjects.length === 0 && !showForm ? (
                <p className="mt-4 text-sm text-gray-400">No subjects added yet. Click "Add Subject" to get started.</p>
            ) : (
                <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                    {enrolledSubjects.map(subject => (
                        <li key={subject.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {subject.subject_code && (
                                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                                            {subject.subject_code}
                                        </span>
                                    )}
                                    <p className="text-sm font-medium text-gray-900">{subject.subject_name}</p>
                                </div>
                                {subject.instructor && (
                                    <p className="mt-0.5 text-xs text-gray-500">Instructor: {subject.instructor}</p>
                                )}
                            </div>
                            <button onClick={() => removeSubject(subject.id)}
                                className="flex-shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                                <IconTrash />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default function Edit({ mustVerifyEmail, status, enrolledSubjects }) {
    const { auth } = usePage().props;
    const isStudent = auth.user.role === 'student';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    {isStudent && (
                        <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                            <EnrolledSubjectsSection
                                enrolledSubjects={enrolledSubjects ?? []}
                            />
                        </div>
                    )}

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
