import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    AreaChart, Area,
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Palette ───────────────────────────────────────────────────────────────────

const COLORS = {
    student:   '#3B82F6',
    faculty:   '#8B5CF6',
    admin:     '#F59E0B',
    scheduled: '#3B82F6',
    ongoing:   '#10B981',
    completed: '#6B7280',
    cancelled: '#EF4444',
    messages:  '#6366F1',
    active:    '#10B981',
    pending:   '#F59E0B',
    suspended: '#EF4444',
};

// ── Reusable components ────────────────────────────────────────────────────────

function Card({ title, subtitle, children, className = '' }) {
    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}>
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>}
                    {subtitle && <p className="mt-0.5 text-2xl font-bold text-gray-900">{subtitle}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

function StatTile({ label, value, color = '#6B7280', delta }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                {delta !== undefined && (
                    <span className={`text-[10px] font-semibold ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {delta >= 0 ? '+' : ''}{delta}
                    </span>
                )}
            </div>
            <p className="text-3xl font-extrabold" style={{ color }}>{value}</p>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
            <p className="mb-1 font-semibold text-gray-700">{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
            ))}
        </div>
    );
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminReports({
    userCounts, locationStats, meetingStats,
    messageStats, cateringStats, registrationTrend,
    messageTrend, topFaculty,
}) {
    // Donut data — user roles
    const rolePie = [
        { name: 'Students', value: userCounts.student, color: COLORS.student },
        { name: 'Faculty',  value: userCounts.faculty, color: COLORS.faculty },
        { name: 'Admins',   value: userCounts.admin,   color: COLORS.admin   },
    ].filter(d => d.value > 0);

    // Donut data — user status
    const statusPie = [
        { name: 'Active',    value: userCounts.active,    color: COLORS.active    },
        { name: 'Pending',   value: userCounts.pending,   color: COLORS.pending   },
        { name: 'Suspended', value: userCounts.suspended, color: COLORS.suspended },
    ].filter(d => d.value > 0);

    // Bar data — meetings
    const meetingBar = [
        { name: 'Scheduled', value: meetingStats.scheduled, fill: COLORS.scheduled },
        { name: 'Ongoing',   value: meetingStats.ongoing,   fill: COLORS.ongoing   },
        { name: 'Completed', value: meetingStats.completed, fill: COLORS.completed },
        { name: 'Cancelled', value: meetingStats.cancelled, fill: COLORS.cancelled },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Reports</h2>
                    <p className="mt-0.5 text-sm text-gray-500">Live system overview and analytics</p>
                </div>
            }
        >
            <Head title="Reports — Admin" />

            <div className="space-y-6 p-6">
                {/* ── Top KPI row ──────────────────────────────────────────── */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile label="Total Users"    value={userCounts.total}        color="#1F2937" />
                    <StatTile label="Pending Approval" value={userCounts.pending}    color={COLORS.pending} />
                    <StatTile label="Total Messages" value={messageStats.total}      color={COLORS.messages} />
                    <StatTile label="Total Meetings" value={meetingStats.total}      color={COLORS.student} />
                </div>

                {/* ── Donut charts row ─────────────────────────────────────── */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="User Distribution by Role">
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="50%" height={180}>
                                <PieChart>
                                    <Pie data={rolePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                        paddingAngle={3} dataKey="value">
                                        {rolePie.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [v, n]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {rolePie.map(d => (
                                    <div key={d.name} className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                        <span className="text-sm text-gray-600">{d.name}</span>
                                        <span className="ml-auto text-sm font-semibold text-gray-900">{d.value}</span>
                                    </div>
                                ))}
                                <div className="border-t border-gray-100 pt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full flex-shrink-0 bg-gray-200" />
                                        <span className="text-sm text-gray-500">Total</span>
                                        <span className="ml-auto text-sm font-bold text-gray-900">{userCounts.total}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="User Status Breakdown">
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="50%" height={180}>
                                <PieChart>
                                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                        paddingAngle={3} dataKey="value">
                                        {statusPie.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [v, n]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {statusPie.map(d => (
                                    <div key={d.name} className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                        <span className="text-sm text-gray-600">{d.name}</span>
                                        <span className="ml-auto text-sm font-semibold text-gray-900">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Line chart — registrations ───────────────────────────── */}
                <Card title="New Registrations — Last 14 Days">
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={registrationTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={1} />
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="count" name="Registrations"
                                stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366F1' }}
                                activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* ── Area chart — messages ────────────────────────────────── */}
                <Card title="Message Activity — Last 30 Days">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={messageTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }}
                                interval={Math.floor(messageTrend.length / 8)} />
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="count" name="Messages"
                                stroke="#6366F1" strokeWidth={2} fill="url(#msgGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* ── Bar chart + top faculty ──────────────────────────────── */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Meeting Status Breakdown">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={meetingBar} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                                    {meetingBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card title="Top Faculty by Schedule Count">
                        {topFaculty.length === 0 ? (
                            <p className="py-4 text-sm text-gray-400">No faculty with schedules yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {topFaculty.map((f, i) => (
                                    <div key={f.id} className="flex items-center gap-3">
                                        <span className="w-5 text-center text-[10px] font-bold text-gray-400">{i + 1}</span>
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
                                            {f.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900">{f.name}</p>
                                            <p className="text-xs text-gray-400">{f.department ?? '—'}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`h-2 w-2 rounded-full ${f.faculty_status?.status === 'busy' ? 'bg-amber-400' : f.faculty_status ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span className="text-sm font-semibold text-gray-700">{f.schedules_count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* ── Location + Catering row ──────────────────────────────── */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <StatTile label="Faculty Sharing Location" value={locationStats.sharing}   color={COLORS.active} />
                    <StatTile label="Location Consent Given"   value={locationStats.consented} color="#6366F1" />
                    <StatTile label="Active Catering Sessions" value={cateringStats.active}    color={COLORS.pending} />
                </div>

                {/* ── Messages quick stats ─────────────────────────────────── */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <StatTile label="Messages (7d)"  value={messageStats.last_7_days}  color={COLORS.messages} />
                    <StatTile label="Messages (30d)" value={messageStats.last_30_days} color={COLORS.messages} />
                    <StatTile label="Catering Today" value={cateringStats.today}       color={COLORS.pending} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
