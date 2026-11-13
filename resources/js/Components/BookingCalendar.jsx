import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

// Map day name → JS Date.getDay() value (Sunday=0)
const DAY_TO_JS = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12(time) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function toYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function todayYMD() {
    return toYMD(new Date());
}

/** Build a 6-row × 7-col calendar grid for the given year/month (1-indexed). */
function buildCalendarGrid(year, month) {
    // month is 1-indexed
    const firstDay  = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Sunday = col 0 … Saturday = col 6
    const startCol = firstDay.getDay();

    const cells = [];
    for (let i = 0; i < startCol; i++) cells.push(null); // leading blanks
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d));
    while (cells.length % 7 !== 0) cells.push(null); // trailing blanks

    // Split into rows of 7
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
}

// ── Avatar helpers ────────────────────────────────────────────────────────────

function initials(name = '') {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}
function avatarColor(name = '') {
    const p = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return p[h % p.length];
}

function FacultyAvatar({ f, size = 32 }) {
    if (f?.avatar_url) return <img src={f.avatar_url} alt={f.name} style={{ width: size, height: size }} className="rounded-full object-cover flex-shrink-0" />;
    return (
        <div className="flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
             style={{ width: size, height: size, background: avatarColor(f?.name ?? '') }}>
            {initials(f?.name)}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BookingCalendar({ faculty: facultyList, onClose }) {
    const today    = new Date();
    const todayStr = todayYMD();

    const [viewYear,  setViewYear]  = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-indexed

    const [selectedFacultyId, setSelectedFacultyId] = useState('');
    const [selectedDate,      setSelectedDate]      = useState(null); // 'YYYY-MM-DD'
    const [selectedSlot,      setSelectedSlot]      = useState(null); // schedule object
    const [bookedSlots,       setBookedSlots]        = useState([]);   // ['YYYY-MM-DD HH:MM']
    const [loadingBooked,     setLoadingBooked]      = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        faculty_id:   '',
        title:        '',
        message:      '',
        requested_at: '',
    });

    // ── Derived data ──────────────────────────────────────────────────────────

    const chosenFaculty = useMemo(
        () => facultyList.find(f => String(f.id) === String(selectedFacultyId)) ?? null,
        [facultyList, selectedFacultyId]
    );

    // Days of week this faculty works (JS getDay() values)
    const facultyWorkDays = useMemo(() => {
        if (!chosenFaculty) return new Set();
        return new Set(
            (chosenFaculty.schedules ?? []).map(s => DAY_TO_JS[s.day])
        );
    }, [chosenFaculty]);

    // Schedules for the selected date's weekday
    const slotsForDate = useMemo(() => {
        if (!chosenFaculty || !selectedDate) return [];
        const jsDay = new Date(selectedDate + 'T00:00:00').getDay();
        const dayName = Object.keys(DAY_TO_JS).find(k => DAY_TO_JS[k] === jsDay);
        return (chosenFaculty.schedules ?? []).filter(s => s.day === dayName);
    }, [chosenFaculty, selectedDate]);

    // Booked datetimes as a Set for O(1) lookup: 'YYYY-MM-DD HH:MM'
    const bookedSet = useMemo(() => new Set(bookedSlots), [bookedSlots]);

    // Calendar grid rows
    const calendarRows = useMemo(
        () => buildCalendarGrid(viewYear, viewMonth),
        [viewYear, viewMonth]
    );

    // ── Fetch booked slots whenever faculty or viewed month changes ───────────

    useEffect(() => {
        if (!selectedFacultyId) { setBookedSlots([]); return; }

        setLoadingBooked(true);
        fetch(route('appointments.availability', { faculty: selectedFacultyId }) +
              `?year=${viewYear}&month=${viewMonth}`)
            .then(r => r.json())
            .then(d => setBookedSlots(d.booked ?? []))
            .catch(() => setBookedSlots([]))
            .finally(() => setLoadingBooked(false));
    }, [selectedFacultyId, viewYear, viewMonth]);

    // ── Reset selection when faculty changes ─────────────────────────────────

    function handleFacultyChange(id) {
        setSelectedFacultyId(id);
        setSelectedDate(null);
        setSelectedSlot(null);
        setData(d => ({ ...d, faculty_id: id, requested_at: '' }));
    }

    // ── Calendar navigation ───────────────────────────────────────────────────

    function prevMonth() {
        if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
        else setViewMonth(m => m - 1);
        setSelectedDate(null);
        setSelectedSlot(null);
        setData(d => ({ ...d, requested_at: '' }));
    }

    function nextMonth() {
        if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
        else setViewMonth(m => m + 1);
        setSelectedDate(null);
        setSelectedSlot(null);
        setData(d => ({ ...d, requested_at: '' }));
    }

    // ── Date classification ───────────────────────────────────────────────────

    function classifyDate(date) {
        if (!date) return 'blank';
        const ymd = toYMD(date);
        // Past dates
        if (ymd < todayStr) return 'past';
        // No faculty selected
        if (!chosenFaculty) return 'unavailable';
        // Today itself — still selectable if faculty works today
        const jsDay = date.getDay();
        if (!facultyWorkDays.has(jsDay)) return 'unavailable';
        // Check if ALL slots on this day are booked
        const dayName = Object.keys(DAY_TO_JS).find(k => DAY_TO_JS[k] === jsDay);
        const daySlots = (chosenFaculty.schedules ?? []).filter(s => s.day === dayName);
        if (daySlots.length === 0) return 'unavailable';
        const allBooked = daySlots.every(s => {
            const hm = s.start_time.slice(0, 5);
            return bookedSet.has(`${ymd} ${hm}`);
        });
        if (allBooked) return 'fullybooked';
        if (ymd === selectedDate) return 'selected';
        return 'available';
    }

    // ── Slot selection ────────────────────────────────────────────────────────

    function handleSlotSelect(slot) {
        setSelectedSlot(slot);
        const time = slot.start_time.slice(0, 5);
        setData(d => ({ ...d, requested_at: `${selectedDate}T${time}` }));
    }

    // ── Date selection ────────────────────────────────────────────────────────

    function handleDateClick(date) {
        const cls = classifyDate(date);
        if (cls === 'past' || cls === 'unavailable' || cls === 'fullybooked' || cls === 'blank') return;
        const ymd = toYMD(date);
        setSelectedDate(ymd);
        setSelectedSlot(null);
        setData(d => ({ ...d, requested_at: '' }));
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    function submit(e) {
        e.preventDefault();
        post(route('appointments.store'), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    // ── Cell styling ─────────────────────────────────────────────────────────

    const cellClass = {
        blank:       'invisible',
        past:        'text-gray-300 cursor-not-allowed',
        unavailable: 'text-gray-300 cursor-not-allowed',
        fullybooked: 'bg-red-50 text-red-300 cursor-not-allowed line-through',
        available:   'text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer font-medium',
        selected:    'bg-blue-600 text-white font-semibold shadow-sm cursor-pointer',
    };

    const canSubmit = data.faculty_id && data.title && data.requested_at;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-6">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl mb-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Book an Appointment</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Select a faculty, pick a date and time slot</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                        {/* ── LEFT PANEL: Faculty + Details ── */}
                        <div className="md:col-span-2 p-5 space-y-4">

                            {/* Faculty selector */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Faculty Member
                                </label>
                                <select
                                    value={selectedFacultyId}
                                    onChange={e => handleFacultyChange(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">— Select faculty —</option>
                                    {facultyList.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}{f.department ? ` · ${f.department}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.faculty_id && <p className="mt-1 text-xs text-red-500">{errors.faculty_id}</p>}
                            </div>

                            {/* Faculty card */}
                            {chosenFaculty && (
                                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                                    <FacultyAvatar f={chosenFaculty} size={36} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{chosenFaculty.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{chosenFaculty.department ?? 'Faculty'}</p>
                                        {chosenFaculty.status === 'pending' && (
                                            <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Pending approval</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Faculty schedule summary */}
                            {chosenFaculty && (chosenFaculty.schedules ?? []).length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Days</p>
                                    <div className="flex flex-wrap gap-1">
                                        {DAY_NAMES.filter(d => (chosenFaculty.schedules ?? []).some(s => s.day === d))
                                            .map(d => (
                                                <span key={d} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                                                    {d.slice(0, 3)}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {chosenFaculty && (chosenFaculty.schedules ?? []).length === 0 && (
                                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    This faculty has no posted schedule. Any available date can be selected.
                                </p>
                            )}

                            {/* Title */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Subject / Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    placeholder="e.g. Thesis consultation"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                            </div>

                            {/* Message */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Message <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </label>
                                <textarea
                                    value={data.message}
                                    onChange={e => setData('message', e.target.value)}
                                    placeholder="Briefly describe the purpose..."
                                    rows={3}
                                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                            </div>

                            {/* Booking summary */}
                            {data.requested_at && selectedSlot && (
                                <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-3 space-y-1">
                                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">Booking Summary</p>
                                    <div className="flex items-center gap-1.5 text-xs text-green-700">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                        </svg>
                                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-green-700">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                        </svg>
                                        {fmt12(selectedSlot.start_time)} – {fmt12(selectedSlot.end_time)}
                                        {selectedSlot.room ? ` · Room ${selectedSlot.room}` : ''}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-green-700">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        {selectedSlot.subject} · {chosenFaculty?.name}
                                    </div>
                                </div>
                            )}

                            {errors.requested_at && (
                                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errors.requested_at}</p>
                            )}
                        </div>

                        {/* ── RIGHT PANEL: Calendar + Time slots ── */}
                        <div className="md:col-span-3 p-5 space-y-4">

                            {/* Month navigation */}
                            <div className="flex items-center justify-between">
                                <button type="button" onClick={prevMonth}
                                    className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                                    disabled={viewYear === today.getFullYear() && viewMonth <= today.getMonth() + 1}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6"/>
                                    </svg>
                                </button>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900">
                                        {MONTH_NAMES[viewMonth - 1]} {viewYear}
                                    </p>
                                    {loadingBooked && (
                                        <p className="text-[10px] text-blue-500 mt-0.5">Loading availability…</p>
                                    )}
                                </div>
                                <button type="button" onClick={nextMonth}
                                    className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Day-of-week headers */}
                            <div className="grid grid-cols-7 text-center">
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                                    <div key={d} className="py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{d}</div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="space-y-1">
                                {calendarRows.map((row, ri) => (
                                    <div key={ri} className="grid grid-cols-7 gap-0.5">
                                        {row.map((date, ci) => {
                                            if (!date) return <div key={ci} />;
                                            const cls  = classifyDate(date);
                                            const ymd  = toYMD(date);
                                            const isToday = ymd === todayStr;
                                            return (
                                                <button
                                                    key={ci}
                                                    type="button"
                                                    onClick={() => handleDateClick(date)}
                                                    disabled={cls === 'past' || cls === 'unavailable' || cls === 'fullybooked'}
                                                    title={
                                                        cls === 'fullybooked' ? 'Fully booked'
                                                        : cls === 'unavailable' ? 'Not available'
                                                        : cls === 'past' ? 'Past date'
                                                        : undefined
                                                    }
                                                    className={[
                                                        'relative flex flex-col items-center justify-center rounded-lg py-1.5 text-sm transition-all',
                                                        cellClass[cls],
                                                        isToday && cls !== 'selected' ? 'ring-2 ring-blue-400 ring-offset-1' : '',
                                                    ].join(' ')}
                                                >
                                                    <span>{date.getDate()}</span>
                                                    {/* Dot indicator for booked-but-not-full days */}
                                                    {cls === 'available' && (() => {
                                                        const jsDay  = date.getDay();
                                                        const dname  = Object.keys(DAY_TO_JS).find(k => DAY_TO_JS[k] === jsDay);
                                                        const dSlots = (chosenFaculty?.schedules ?? []).filter(s => s.day === dname);
                                                        const anyBooked = dSlots.some(s => bookedSet.has(`${ymd} ${s.start_time.slice(0,5)}`));
                                                        return anyBooked ? <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-amber-400" /> : null;
                                                    })()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3">
                                {[
                                    { color: 'bg-blue-600',  label: 'Selected' },
                                    { color: 'bg-green-100 border border-green-300', label: 'Available' },
                                    { color: 'bg-red-50 border border-red-200',      label: 'Fully booked' },
                                    { color: 'bg-gray-100',  label: 'Unavailable' },
                                    { color: 'ring-2 ring-blue-400 bg-white',        label: 'Today' },
                                    { color: 'bg-amber-400 w-2 h-2 rounded-full',   label: 'Partially booked' },
                                ].map(({ color, label }) => (
                                    <div key={label} className="flex items-center gap-1.5">
                                        <span className={`inline-block h-3 w-3 rounded ${color}`} />
                                        <span className="text-[10px] text-gray-500">{label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Time slots */}
                            {selectedDate && slotsForDate.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Time Slots — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {slotsForDate.map(slot => {
                                            const hm      = slot.start_time.slice(0, 5);
                                            const isBooked = bookedSet.has(`${selectedDate} ${hm}`);
                                            const isActive = selectedSlot?.id === slot.id;
                                            return (
                                                <button
                                                    key={slot.id}
                                                    type="button"
                                                    disabled={isBooked}
                                                    onClick={() => !isBooked && handleSlotSelect(slot)}
                                                    className={[
                                                        'relative rounded-xl border px-3 py-2.5 text-left transition-all',
                                                        isBooked  ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50' :
                                                        isActive  ? 'border-blue-500 bg-blue-600 text-white shadow-md' :
                                                                    'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer',
                                                    ].join(' ')}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                                            {fmt12(slot.start_time)}
                                                        </span>
                                                        <span className={`text-[10px] ${isActive ? 'text-blue-200' : isBooked ? 'text-red-400' : 'text-gray-400'}`}>
                                                            {isBooked ? 'Booked' : `until ${fmt12(slot.end_time)}`}
                                                        </span>
                                                    </div>
                                                    <p className={`mt-0.5 text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                                                        {slot.subject}{slot.room ? ` · Room ${slot.room}` : ''}
                                                    </p>
                                                    {isActive && (
                                                        <span className="absolute right-2 top-2">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"/>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedDate && slotsForDate.length === 0 && chosenFaculty && (chosenFaculty.schedules ?? []).length === 0 && (
                                <div>
                                    <p className="mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date &amp; Time</p>
                                    <input
                                        type="datetime-local"
                                        value={data.requested_at}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={e => setData('requested_at', e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                    />
                                </div>
                            )}

                            {!selectedFacultyId && (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                    <p className="text-sm text-gray-400">Select a faculty member to view the calendar</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                        <p className="text-xs text-gray-400">
                            Appointment requests are reviewed by admin before confirmation.
                        </p>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !canSubmit}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                            >
                                {processing && (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                    </svg>
                                )}
                                {processing ? 'Submitting…' : 'Request Appointment'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
