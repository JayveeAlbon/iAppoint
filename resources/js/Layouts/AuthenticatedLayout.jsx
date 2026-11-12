import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconDashboard() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

function IconUsers() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function IconClock() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function IconUser() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function IconFileText() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    );
}

function IconSettings() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    );
}

function IconLogOut() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

function IconChevronDown() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function IconMenu() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    );
}

function IconMessage() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function IconActivity() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    );
}

function IconBell() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </svg>
    );
}

function IconMessageSquare() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="13" y2="14" />
        </svg>
    );
}


// ── Nav components ─────────────────────────────────────────────────────────────

function Badge({ count }) {
    if (!count || count < 1) return null;
    return (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
        </span>
    );
}

// Sidebar nav item — navy theme (see mockup)
function NavItem({ href, icon, label, active, disabled = false, badge = 0, onClick }) {
    if (disabled) {
        return (
            <span className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40">
                <span className="text-white/40">{icon}</span>
                {label}
            </span>
        );
    }

    const cls = `group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${
        active
            ? 'bg-white text-[#1D3B6E] font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.15)]'
            : 'text-white/85 hover:bg-white/10 hover:text-white'
    }`;

    const inner = (
        <>
            {active && (
                <span
                    aria-hidden
                    className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-white"
                />
            )}
            <span className={active ? 'text-[#1D3B6E]' : 'text-white/70 group-hover:text-white'}>
                {icon}
            </span>
            <span className="flex-1 truncate">{label}</span>
            <Badge count={badge} />
        </>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cls}>
                {inner}
            </button>
        );
    }

    return (
        <Link href={href} className={cls}>
            {inner}
        </Link>
    );
}

function NavSection({ label, children, hideLabel = false }) {
    return (
        <div className="mb-3">
            {!hideLabel && label && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    {label}
                </p>
            )}
            <div className="space-y-1">{children}</div>
        </div>
    );
}

// ── User dropdown ──────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 6 }) {
    const inits = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const px = size * 4;
    if (user.avatar_url) {
        return <img src={user.avatar_url} alt={user.name} style={{ width: px, height: px }} className="rounded-full object-cover flex-shrink-0" />;
    }
    return (
        <div style={{ width: px, height: px }} className="flex flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
            {inits}
        </div>
    );
}

function UserDropdown({ user }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const isAdmin = user.role === 'admin';

    const inits = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    useEffect(() => {
        function outside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', outside);
        return () => document.removeEventListener('mousedown', outside);
    }, []);

    const adminItems = [
        { label: 'Users',        icon: <IconUsers />,    href: route('admin.users.index'),         active: route().current('admin.users.*') },
        { label: 'Appointments', icon: <IconCalendar />, href: route('admin.appointments.index'),  active: route().current('admin.appointments.*') },
        { label: 'History',      icon: <IconFileText />, href: route('admin.audit.index'),         active: route().current('admin.audit.*') },
        { label: 'Settings',     icon: <IconSettings />, href: route('admin.settings.index'),      active: route().current('admin.settings.*') },
    ];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(s => !s)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
                <UserAvatar user={user} size={6} />
                <span className="hidden max-w-[140px] truncate sm:block">{user.name}</span>
                <span className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
                    <IconChevronDown />
                </span>
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <Link
                        href={route('profile.edit')}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <span className="text-gray-400"><IconUser /></span>
                        Profile
                    </Link>

                    {isAdmin && (
                        <>
                            <div className="my-1 border-t border-gray-100" />
                            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                Administration
                            </p>
                            {adminItems.map(item => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 ${item.active ? 'font-medium text-gray-900' : 'text-gray-700'}`}
                                >
                                    <span className="text-gray-400">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </>
                    )}

                    <div className="my-1 border-t border-gray-100" />
                    <button
                        onClick={() => { setOpen(false); router.post(route('logout')); }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <span className="text-gray-400"><IconLogOut /></span>
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({ user, notifications }) {
    const isAdmin   = user.role === 'admin';
    const isFaculty = user.role === 'faculty';
    const isStudent = user.role === 'student';

    const roleLabel =
        isAdmin   ? 'Administrator' :
        isFaculty ? 'Faculty'       : 'Student';

    const unreadMessages = notifications?.unread_messages ?? 0;

    return (
        <aside className="flex h-full w-60 flex-shrink-0 flex-col bg-[#1D3B6E] text-white shadow-xl">
            <div className="flex h-14 items-center border-b border-white/10 px-4">
                <span className="text-sm font-semibold tracking-tight text-white">iAppoint</span>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
                <NavSection label="Main">
                    <NavItem href={route('dashboard')} icon={<IconDashboard />} label="Dashboard" active={route().current('dashboard')} />
                </NavSection>

                {!isFaculty && (
                    <NavSection label="Faculty">
                        <NavItem href={route('faculty.directory')} icon={<IconUsers />} label="Find Faculty" active={route().current('faculty.directory')} />
                    </NavSection>
                )}

                {!isAdmin && (
                    <NavSection label="Appointments">
                        <NavItem
                            href={route('appointments.index')}
                            icon={<IconCalendar />}
                            label="My Appointments"
                            active={route().current('appointments.*')}
                        />
                        {isFaculty && (
                            <NavItem href={route('schedule.index')} icon={<IconClock />} label="My Schedule" active={route().current('schedule.index')} />
                        )}
                    </NavSection>
                )}

                {!isAdmin && (
                    <NavSection label="Community">
                        <NavItem
                            href={route('notifications.index')}
                            icon={<IconBell />}
                            label="Notifications"
                            badge={notifications?.total ?? 0}
                            active={route().current('notifications.*')}
                        />
                        {isStudent ? (
                            <NavItem
                                href={route('student.feedback.index')}
                                icon={<IconMessageSquare />}
                                label="Feedback"
                                active={route().current('student.feedback.*')}
                            />
                        ) : (
                            <NavItem
                                href={route('faculty.feedback.index')}
                                icon={<IconMessageSquare />}
                                label="Feedback"
                                active={route().current('faculty.feedback.*')}
                            />
                        )}
                        {isFaculty && (
                            <NavItem
                                href={route('faculty-status.index')}
                                icon={<IconActivity />}
                                label="My Status"
                                active={route().current('faculty-status.*')}
                            />
                        )}
                        {isFaculty && (
                            <NavItem href={route('faculty-settings.index')} icon={<IconSettings />} label="Settings" active={route().current('faculty-settings.*')} />
                        )}
                    </NavSection>
                )}

                {isAdmin && (
                    <NavSection label="Administration">
                        <NavItem href={route('admin.users.index')}        icon={<IconUsers />}    label="Users"        badge={notifications?.pending_faculty ?? 0} active={route().current('admin.users.*')} />
                        <NavItem href={route('admin.appointments.index')} icon={<IconCalendar />} label="Appointments" badge={notifications?.pending_appointments ?? 0} active={route().current('admin.appointments.*')} />
                        <NavItem href={route('admin.feedback.index')}     icon={<IconMessage />}  label="Feedback"     badge={notifications?.pending_admin_feedback ?? 0} active={route().current('admin.feedback.*')} />
                        <NavItem href={route('notifications.index')}      icon={<IconBell />}     label="Notifications" badge={notifications?.total ?? 0} active={route().current('notifications.*')} />
                        <NavItem href={route('admin.audit.index')}        icon={<IconFileText />} label="History"      active={route().current('admin.audit.*')} />
                        <NavItem href={route('admin.settings.index')}     icon={<IconSettings />} label="Settings"     active={route().current('admin.settings.*')} />
                    </NavSection>
                )}
            </nav>

            {/* User footer */}
            <div className="border-t border-white/10 px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <UserAvatar user={user} size={7} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">{user.name}</p>
                        <div className="flex items-center gap-1.5">
                            <p className="truncate text-[10px] text-white/60">{roleLabel}</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

// ── Main layout ────────────────────────────────────────────────────────────────

import FeedbackFab from '@/Components/FeedbackFab';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, notifications } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar user={user} notifications={notifications} />
            </div>

            {/* Main area */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
                    <button
                        onClick={() => setSidebarOpen(s => !s)}
                        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
                    >
                        <IconMenu />
                    </button>
                    <div className="hidden lg:block" />
                    <UserDropdown user={user} />
                </div>

                {header && (
                    <div className="border-b border-gray-200 bg-white px-6 py-4">{header}</div>
                )}

                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>

            {user.role !== 'admin' && <FeedbackFab />}
        </div>
    );
}
