import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

function IconPlus() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
    );
}
function IconEdit() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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

function SubjectForm({ initial = null, onCancel }) {
    const isEdit = initial !== null;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:        initial?.name        ?? '',
        description: initial?.description ?? '',
    });

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('faculty-settings.update', initial.id), { onSuccess: onCancel });
        } else {
            post(route('faculty-settings.store'), { onSuccess: () => { reset(); onCancel?.(); } });
        }
    }

    return (
        <form onSubmit={submit} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="mb-4 text-sm font-semibold text-gray-900">
                {isEdit ? 'Edit Subject' : 'Add Subject'}
            </p>
            <div className="space-y-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Subject Name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        placeholder="e.g. Thesis Consultation, BSIT Advisory, Academic Concerns"
                        required
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Description <span className="text-gray-400">(optional)</span></label>
                    <textarea
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        rows={2}
                        placeholder="Brief description of this subject or consultation type..."
                        className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button
                    type="submit"
                    disabled={processing || !data.name}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                    {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Subject'}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export default function FacultySettings({ subjects }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    function deleteSubject(subject) {
        if (!confirm(`Remove "${subject.name}"?`)) return;
        router.delete(route('faculty-settings.destroy', subject.id), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Manage the subjects students can choose when booking an appointment with you.
                        </p>
                    </div>
                    {!showForm && !editing && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            <IconPlus /> Add Subject
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Faculty Settings" />

            <div className="p-6 space-y-4">
                {/* Add form */}
                {showForm && (
                    <SubjectForm onCancel={() => setShowForm(false)} />
                )}

                {/* Edit form */}
                {editing && (
                    <SubjectForm initial={editing} onCancel={() => setEditing(null)} />
                )}

                {/* Subjects list */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">Appointment Subjects</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Students will see these when requesting an appointment with you.
                        </p>
                    </div>

                    {subjects.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="text-sm text-gray-400">No subjects added yet.</p>
                            <p className="mt-1 text-xs text-gray-400">Click "Add Subject" to get started.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {subjects.map(subject => (
                                <li key={subject.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                                        {subject.description && (
                                            <p className="mt-0.5 text-xs text-gray-500">{subject.description}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-shrink-0 gap-1">
                                        <button
                                            onClick={() => { setEditing(subject); setShowForm(false); }}
                                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                        >
                                            <IconEdit />
                                        </button>
                                        <button
                                            onClick={() => deleteSubject(subject)}
                                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                        >
                                            <IconTrash />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-xs text-blue-700">
                        <span className="font-semibold">Tip:</span> Add subjects like "Thesis Consultation", "Academic Advising", or "BSIT Concerns" so students know what they can book an appointment for.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
