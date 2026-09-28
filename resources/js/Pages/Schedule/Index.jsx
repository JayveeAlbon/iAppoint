import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmt(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${period}`;
}

function IconPlus() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}
function IconEdit() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}
function IconTrash() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
    );
}
function IconX() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function ScheduleForm({ initial = null, onCancel }) {
    const isEdit = initial !== null;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        day:         initial?.day         ?? 'Monday',
        start_time:  initial?.start_time?.slice(0, 5) ?? '',
        end_time:    initial?.end_time?.slice(0, 5)   ?? '',
        subject:     initial?.subject     ?? '',
        room:        initial?.room        ?? '',
        description: initial?.description ?? '',
    });

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('schedule.update', initial.id), { onSuccess: onCancel });
        } else {
            post(route('schedule.store'), { onSuccess: () => { reset(); onCancel?.(); } });
        }
    }

    return (
        <form onSubmit={submit} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="mb-4 text-sm font-medium text-gray-900">
                {isEdit ? 'Edit Schedule Entry' : 'Add Schedule Entry'}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Day</label>
                    <select
                        value={data.day}
                        onChange={(e) => setData('day', e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    >
                        {DAYS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Start Time</label>
                    <input
                        type="time"
                        value={data.start_time}
                        onChange={(e) => setData('start_time', e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    {errors.start_time && <p className="mt-1 text-xs text-red-500">{errors.start_time}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">End Time</label>
                    <input
                        type="time"
                        value={data.end_time}
                        onChange={(e) => setData('end_time', e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    {errors.end_time && <p className="mt-1 text-xs text-red-500">{errors.end_time}</p>}
                </div>

                <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Subject / Course</label>
                    <input
                        type="text"
                        value={data.subject}
                        onChange={(e) => setData('subject', e.target.value)}
                        placeholder="e.g. CS301 — Data Structures"
                        required
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Room <span className="text-gray-400">(optional)</span></label>
                    <input
                        type="text"
                        value={data.room}
                        onChange={(e) => setData('room', e.target.value)}
                        placeholder="e.g. Room 302, CBA Bldg"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Description <span className="text-gray-400">(optional)</span></label>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={2}
                        placeholder="Additional notes..."
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                    />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                    {isEdit ? 'Save Changes' : 'Add Entry'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

function ScheduleEntry({ entry, onEdit }) {
    function del() {
        if (confirm('Remove this schedule entry?')) {
            router.delete(route('schedule.destroy', entry.id));
        }
    }

    return (
        <div className="flex items-start justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-3.5 py-2.5">
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{entry.subject}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                    {fmt(entry.start_time)} — {fmt(entry.end_time)}
                    {entry.room && <span className="ml-2 text-gray-400">· {entry.room}</span>}
                </p>
                {entry.description && (
                    <p className="mt-1 text-xs text-gray-400">{entry.description}</p>
                )}
            </div>
            <div className="flex flex-shrink-0 gap-1">
                <button
                    onClick={() => onEdit(entry)}
                    className="rounded p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
                >
                    <IconEdit />
                </button>
                <button
                    onClick={del}
                    className="rounded p-1.5 text-gray-400 hover:bg-white hover:text-red-500"
                >
                    <IconTrash />
                </button>
            </div>
        </div>
    );
}

export default function ScheduleIndex({ schedules }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const grouped = DAYS.reduce((acc, day) => {
        acc[day] = schedules.filter((s) => s.day === day);
        return acc;
    }, {});

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">My Schedule</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Manage your weekly schedule — students can see this publicly.
                        </p>
                    </div>
                    {!showForm && !editing && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            <IconPlus /> Add Entry
                        </button>
                    )}
                </div>
            }
        >
            <Head title="My Schedule" />

            <div className="space-y-4 p-6">
                {/* Add form */}
                {showForm && (
                    <ScheduleForm onCancel={() => setShowForm(false)} />
                )}

                {/* Edit form */}
                {editing && (
                    <ScheduleForm
                        initial={editing}
                        onCancel={() => setEditing(null)}
                    />
                )}

                {/* Weekly grid */}
                {DAYS.map((day) => {
                    const entries = grouped[day];
                    const isToday = day === today;
                    return (
                        <div key={day}>
                            <div className="mb-1.5 flex items-center gap-2">
                                <p className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {day}
                                </p>
                                {isToday && (
                                    <span className="rounded-full bg-gray-900 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white">
                                        Today
                                    </span>
                                )}
                            </div>

                            {entries.length === 0 ? (
                                <p className="rounded-md border border-dashed border-gray-200 py-3 text-center text-xs text-gray-400">
                                    No classes
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {entries.map((e) => (
                                        <ScheduleEntry
                                            key={e.id}
                                            entry={e}
                                            onEdit={setEditing}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </AuthenticatedLayout>
    );
}
