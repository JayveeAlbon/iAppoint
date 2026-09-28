import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Southern Christian College, Midsayap, Cotabato
const CAMPUS_CENTER = [7.19890, 124.53780];
const CAMPUS_RADIUS_METERS = 280;

// Radar-pulse marker anchored at campus center
function createRadarPulse() {
    return L.divIcon({
        html: `<div class="scc-radar">
            <span class="scc-radar__ring"></span>
            <span class="scc-radar__ring scc-radar__ring--delayed"></span>
            <span class="scc-radar__dot"></span>
        </div>`,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
}

// Color palette for avatar backgrounds
function nameColor(name = '') {
    const palette = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    return palette[h % palette.length];
}

// Custom circle-avatar marker — shows photo if available, initials otherwise
function createMarker(name, avatarUrl) {
    const inits = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const color = nameColor(name);

    const inner = avatarUrl
        ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
        : `<span style="color:#fff;font-size:11px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;">${inits}</span>`;

    return L.divIcon({
        html: `<div style="
            width:36px;height:36px;
            background:${avatarUrl ? '#e5e7eb' : color};border-radius:50%;
            border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
            overflow:hidden;
        ">${inner}</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22],
    });
}

function IconList() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    );
}

function fmt(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${period}`;
}

export default function Map({ faculty, offlineFaculty, today }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Faculty Map
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {faculty.length} faculty sharing live location
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span className="text-gray-400">Southern Christian College</span>
                        </p>
                    </div>
                    <Link
                        href={route('faculty.directory')}
                        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <IconList />
                        Directory
                    </Link>
                </div>
            }
        >
            <Head title="Faculty Map" />

            <style>{`
                .scc-radar {
                    position: relative;
                    width: 0;
                    height: 0;
                    pointer-events: none;
                }
                .scc-radar__ring {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 14px;
                    height: 14px;
                    margin-left: -7px;
                    margin-top: -7px;
                    border-radius: 50%;
                    background: rgba(37, 99, 235, 0.45);
                    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35);
                    animation: scc-radar-pulse 2s ease-out infinite;
                }
                .scc-radar__ring--delayed {
                    animation-delay: 1s;
                }
                .scc-radar__dot {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 10px;
                    height: 10px;
                    margin-left: -5px;
                    margin-top: -5px;
                    border-radius: 50%;
                    background: #2563eb;
                    box-shadow: 0 0 0 2px #fff, 0 0 6px rgba(37, 99, 235, 0.7);
                }
                @keyframes scc-radar-pulse {
                    0%   { transform: scale(1);  opacity: 0.9; }
                    80%  { transform: scale(8);  opacity: 0;   }
                    100% { transform: scale(8);  opacity: 0;   }
                }
            `}</style>

            <div className="flex flex-col gap-3 p-6">
                {/* Map */}
                <div
                    className="overflow-hidden rounded-lg border border-gray-200"
                    style={{ height: '520px' }}
                >
                    <MapContainer
                        center={CAMPUS_CENTER}
                        zoom={17}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* SCC campus radius */}
                        <Circle
                            center={CAMPUS_CENTER}
                            radius={CAMPUS_RADIUS_METERS}
                            pathOptions={{
                                color: '#2563eb',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.08,
                                weight: 3,
                            }}
                        />

                        {/* Radar pulse at campus center */}
                        <Marker
                            position={CAMPUS_CENTER}
                            icon={createRadarPulse()}
                            interactive={false}
                            keyboard={false}
                        />

                        {faculty.map((member) => (
                            <Marker
                                key={member.id}
                                position={[
                                    parseFloat(member.latitude),
                                    parseFloat(member.longitude),
                                ]}
                                icon={createMarker(member.name, member.avatar_url)}
                            >
                                <Popup minWidth={220}>
                                    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', padding: '2px 0' }}>
                                        <p style={{ fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: 2 }}>
                                            {member.name}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: 2 }}>
                                            {member.department}
                                        </p>
                                        {member.office_location && (
                                            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: 8 }}>
                                                {member.office_location}
                                            </p>
                                        )}

                                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8, marginBottom: 8 }}>
                                            <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 6 }}>
                                                Today — {today}
                                            </p>
                                            {member.schedules && member.schedules.length > 0 ? (
                                                member.schedules.map((s) => (
                                                    <div key={s.id} style={{ marginBottom: 6, background: '#f9fafb', borderRadius: 6, padding: '6px 8px' }}>
                                                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937', marginBottom: 1 }}>
                                                            {s.subject}
                                                        </p>
                                                        <p style={{ fontSize: '11px', color: '#6b7280' }}>
                                                            {fmt(s.start_time)} — {fmt(s.end_time)}
                                                            {s.room && <span style={{ color: '#9ca3af' }}> · {s.room}</span>}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ fontSize: '11px', color: '#d1d5db', fontStyle: 'italic' }}>
                                                    No classes today
                                                </p>
                                            )}
                                        </div>

                                        <a
                                            href={`/faculty/${member.id}/schedule`}
                                            style={{ fontSize: '11px', color: '#4b5563', textDecoration: 'underline' }}
                                        >
                                            View full schedule
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Faculty without a location */}
                {offlineFaculty.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Not sharing location ({offlineFaculty.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {offlineFaculty.map((member) => (
                                <span
                                    key={member.id}
                                    className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500"
                                >
                                    {member.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {faculty.length === 0 && offlineFaculty.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
                        <p className="text-sm text-gray-500">No faculty registered yet.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
