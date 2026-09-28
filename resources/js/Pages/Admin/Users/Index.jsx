import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

function IconSearch() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}
function IconEdit() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}
function IconTrash() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
    );
}
function IconCheck() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
function IconX() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const ROLE_PILL = {
    student: 'bg-blue-50 text-blue-700',
    faculty: 'bg-purple-50 text-purple-700',
    admin:   'bg-amber-50 text-amber-700',
};

const STATUS_PILL = {
    active:    'bg-green-50 text-green-700',
    pending:   'bg-amber-50 text-amber-700',
    suspended: 'bg-red-50 text-red-500',
};

// ── Edit modal ─────────────────────────────────────────────────────────────────

function EditUserModal({ user, onClose }) {
    const { data, setData, patch, processing, errors } = useForm({
        role:            user.role,
        status:          user.status,
        department:      user.department ?? '',
        office_location: user.office_location ?? '',
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                        {initials(user.name)}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
                        <select value={data.role} onChange={e => setData('role', e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none">
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
                        <select value={data.status} onChange={e => setData('status', e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none">
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    {data.role === 'faculty' && (
                        <>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Department</label>
                                <input type="text" value={data.department} onChange={e => setData('department', e.target.value)}
                                    placeholder="e.g. Computer Science"
                                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Office Location</label>
                                <input type="text" value={data.office_location} onChange={e => setData('office_location', e.target.value)}
                                    placeholder="e.g. Room 201"
                                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-5 flex gap-2">
                    <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button
                        onClick={() => patch(route('admin.users.update', { user: user.id }), { preserveScroll: true, onSuccess: onClose })}
                        disabled={processing}
                        className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminUsersIndex({ users, filters, counts }) {
    const [editUser, setEditUser] = useState(null);
    const [search, setSearch]     = useState(filters.q ?? '');
    const [role, setRole]         = useState(filters.role ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    function applyFilters(overrides = {}) {
        router.get(route('admin.users.index'), { q: search, role, status: statusFilter, ...overrides }, {
            preserveState: true, replace: true,
        });
    }

    function approve(user) {
        router.post(route('admin.users.approve', { user: user.id }), {}, { preserveScroll: true });
    }

    function reject(user) {
        if (!confirm(`Reject and delete ${user.name}'s registration?`)) return;
        router.delete(route('admin.users.reject', { user: user.id }), { preserveScroll: true });
    }

    function deleteUser(user) {
        if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
        router.delete(route('admin.users.destroy', { user: user.id }), { preserveScroll: true });
    }

    const pendingCount = counts.pending;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {counts.total} total · {counts.faculty} faculty · {counts.student} students · {counts.admin} admins
                            {pendingCount > 0 && (
                                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                    {pendingCount} pending approval
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Users — Admin" />
            {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

            <div className="p-6 space-y-4">
                {/* Pending approvals banner */}
                {pendingCount > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-amber-900">
                            {pendingCount} registration{pendingCount !== 1 ? 's' : ''} awaiting approval
                        </p>
                        <div className="space-y-2">
                            {users.data.filter(u => u.status === 'pending').map(u => (
                                <div key={u.id} className="flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 shadow-sm">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                                        {initials(u.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                                        <p className="truncate text-xs text-gray-400">{u.email} · {u.course ?? u.department ?? '—'}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => approve(u)}
                                            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                                            <IconCheck /> Approve
                                        </button>
                                        <button onClick={() => reject(u)}
                                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                                            <IconX /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {counts.pending > users.data.filter(u => u.status === 'pending').length && (
                                <button onClick={() => applyFilters({ status: 'pending' })}
                                    className="text-xs text-amber-700 underline">
                                    View all pending users →
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400"><IconSearch /></span>
                        <input type="text" value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            placeholder="Search name or email…"
                            className="rounded-md border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                            style={{ minWidth: 220 }} />
                    </div>
                    <select value={role} onChange={e => { setRole(e.target.value); applyFilters({ role: e.target.value }); }}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none">
                        <option value="">All Roles</option>
                        <option value="student">Students</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admins</option>
                    </select>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); applyFilters({ status: e.target.value }); }}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    <button onClick={() => applyFilters()}
                        className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Search
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">User</th>
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Role</th>
                                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                                <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Department</th>
                                <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Joined</th>
                                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.data.map(user => (
                                <tr key={user.id} className={`hover:bg-gray-50 ${user.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
                                                {initials(user.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="truncate text-xs text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ROLE_PILL[user.role] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_PILL[user.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="hidden px-5 py-3.5 text-sm text-gray-500 sm:table-cell">{user.department ?? '—'}</td>
                                    <td className="hidden px-5 py-3.5 text-xs text-gray-400 lg:table-cell">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {user.status === 'pending' ? (
                                                <>
                                                    <button onClick={() => approve(user)}
                                                        className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                                                        <IconCheck /> Approve
                                                    </button>
                                                    <button onClick={() => reject(user)}
                                                        className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50">
                                                        <IconX /> Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => setEditUser(user)}
                                                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                                                        <IconEdit /> Edit
                                                    </button>
                                                    <button onClick={() => deleteUser(user)}
                                                        className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50">
                                                        <IconTrash />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.data.length === 0 && (
                        <div className="p-8 text-center text-sm text-gray-400">No users match the selected filters.</div>
                    )}
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {users.current_page} of {users.last_page} · {users.total} users</span>
                        <div className="flex gap-1">
                            {users.links.map((link, i) => (
                                <Link key={i} href={link.url ?? '#'} preserveState
                                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                        link.active ? 'border-gray-900 bg-gray-900 text-white'
                                        : link.url ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                        : 'cursor-default border-gray-100 bg-gray-50 text-gray-300'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
