import { useEffect, useState, useRef, useMemo } from 'react';
import { getNearbyWorkers, getAllTasks } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Leaflet is loaded via CDN in index.html — we pull from window.L
function useLeaflet() {
    const [ready, setReady] = useState(!!window.L);
    useEffect(() => {
        if (window.L) { setReady(true); return; }
        const check = setInterval(() => { if (window.L) { setReady(true); clearInterval(check); } }, 200);
        return () => clearInterval(check);
    }, []);
    return ready;
}

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

// Slightly offset latlng so markers don't pile on exact same spot in demo
function jitter(lat, lng, index = 0) {
    const offsets = [
        [0, 0], [0.003, 0.004], [-0.004, 0.002], [0.002, -0.005],
        [-0.003, -0.003], [0.005, 0.001], [-0.001, 0.006], [0.004, -0.002],
        [-0.005, 0.003], [0.001, -0.004]
    ];
    const [dlat, dlng] = offsets[index % offsets.length];
    return [lat + dlat, lng + dlng];
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = degrees => degrees * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const WORKER_RADIUS_KM = 20;
const TASK_RADIUS_KM = 15;

export default function NearbyMap() {
    const { user } = useAuth();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const leafletReady = useLeaflet();
    const [workers, setWorkers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [userLoc, setUserLoc] = useState(PUNE_CENTER);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null); // { type: 'worker'|'task', data }
    const isWorker = user?.role === 'WORKER';

    const nearbyWorkers = useMemo(() => workers.filter(w => w.latitude && w.longitude && getDistanceKm(userLoc.lat, userLoc.lng, w.latitude, w.longitude) <= WORKER_RADIUS_KM), [workers, userLoc]);
    const nearbyTasks = useMemo(() => tasks.filter(t => t.latitude && t.longitude && getDistanceKm(userLoc.lat, userLoc.lng, t.latitude, t.longitude) <= TASK_RADIUS_KM), [tasks, userLoc]);

    /* ─── Fetch data ─────────────────────────────────── */
    useEffect(() => {
        const load = async (lat, lng) => {
            try {
                const [wRes, tRes] = await Promise.all([
                    getNearbyWorkers(lat, lng),
                    isWorker ? getAllTasks() : Promise.resolve({ data: [] })
                ]);
                setWorkers(wRes.data || []);
                if (isWorker) setTasks((tRes.data || []).filter(t => t.status === 'OPEN'));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        navigator.geolocation.getCurrentPosition(
            pos => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(loc);
                load(loc.lat, loc.lng);
            },
            () => load(PUNE_CENTER.lat, PUNE_CENTER.lng)
        );
    }, [isWorker]);

    /* ─── Build map once Leaflet + container ready ────── */
    useEffect(() => {
        if (!leafletReady || !mapRef.current || mapInstance.current) return;
        const L = window.L;

        const map = L.map(mapRef.current, { zoomControl: true }).setView([userLoc.lat, userLoc.lng], 13);
        mapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        return () => { map.remove(); mapInstance.current = null; };
    }, [leafletReady, userLoc.lat, userLoc.lng]);

    useEffect(() => {
        if (!mapInstance.current || !leafletReady) return;
        mapInstance.current.setView([userLoc.lat, userLoc.lng], 13);
    }, [userLoc, leafletReady]);

    /* ─── Add markers whenever data or map changes ─── */
    useEffect(() => {
        if (!mapInstance.current || !leafletReady) return;
        const L = window.L;
        const map = mapInstance.current;

        // Clear old layers
        map.eachLayer(layer => { if (layer._isCustomMarker) map.removeLayer(layer); });

        // My location marker
        const youIcon = L.divIcon({
            html: `<div style="width:18px;height:18px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.3)"></div>`,
            className: '', iconAnchor: [9, 9]
        });
        const myMarker = L.marker([userLoc.lat, userLoc.lng], { icon: youIcon });
        myMarker._isCustomMarker = true;
        myMarker.addTo(map).bindPopup('<strong>📍 You are here</strong>');

        // Worker markers (circular green circles)
        nearbyWorkers.forEach((w, i) => {
            const lat = w.latitude || userLoc.lat;
            const lng = w.longitude || userLoc.lng;
            const [jLat, jLng] = jitter(lat, lng, i + 1);

            const workerIcon = L.divIcon({
                html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#10b981,#059669);border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.4);font-size:16px;cursor:pointer">👷</div>`,
                className: '', iconAnchor: [18, 18]
            });
            const marker = L.marker([jLat, jLng], { icon: workerIcon });
            marker._isCustomMarker = true;
            marker.addTo(map);
            marker.on('click', () => setSelected({ type: 'worker', data: w }));

            // Pulse circle
            const circle = L.circle([jLat, jLng], {
                color: '#10b981', fillColor: '#10b981', fillOpacity: 0.08,
                weight: 1.5, radius: 300
            });
            circle._isCustomMarker = true;
            circle.addTo(map);
        });

        // Task markers (for workers) — blue pins
        if (isWorker) {
            nearbyTasks.forEach((t, i) => {
                const lat = t.latitude || userLoc.lat;
                const lng = t.longitude || userLoc.lng;
                const [jLat, jLng] = jitter(lat, lng, -(i + 1));

                const taskIcon = L.divIcon({
                    html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#2563eb);border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(99,102,241,0.4);font-size:16px;cursor:pointer">📋</div>`,
                    className: '', iconAnchor: [18, 18]
                });
                const marker = L.marker([jLat, jLng], { icon: taskIcon });
                marker._isCustomMarker = true;
                marker.addTo(map);
                marker.on('click', () => setSelected({ type: 'task', data: t }));
            });
        }
    }, [nearbyWorkers, nearbyTasks, userLoc, leafletReady, isWorker]);

    /* ─── Render ─────────────────────────────────────── */
    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <span style={badge}>{isWorker ? 'Tasks Near You' : 'Nearby Workers'}</span>
                <h2 style={{ margin: '8px 0 4px', color: '#0f172a', fontSize: 28 }}>
                    {isWorker ? '📋 Open Tasks On Map' : '👷 Workers Around You'}
                </h2>
                <p style={{ color: '#64748b', margin: 0 }}>
                    {loading ? 'Fetching location...' :
                        isWorker
                            ? `${nearbyTasks.length} open task${nearbyTasks.length !== 1 ? 's' : ''} found near you`
                            : `${nearbyWorkers.length} worker${nearbyWorkers.length !== 1 ? 's' : ''} available nearby`
                    }
                </p>
            </div>

            {/* Legend */}
            <div style={legend}>
                <span style={legendItem}><span style={{ ...dot, background: '#2563eb' }} /> You</span>
                {!isWorker && <span style={legendItem}><span style={{ ...dot, background: '#10b981' }} /> Workers</span>}
                {isWorker && <span style={legendItem}><span style={{ ...dot, background: '#6366f1' }} /> Open Tasks</span>}
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Click a marker to see details</span>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Map */}
                <div style={{ flex: '1 1 400px', minWidth: 300 }}>
                    {!leafletReady && (
                        <div style={{ height: 480, background: '#f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            Loading map...
                        </div>
                    )}
                    <div ref={mapRef} style={{ height: 480, borderRadius: 16, border: '2px solid #e2e8f0', display: leafletReady ? 'block' : 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }} />
                </div>

                {/* Side panel */}
                <div style={{ flex: '0 0 280px', minWidth: 240 }}>
                    {/* Info card */}
                    {selected && (
                        <div style={infoCard}>
                            <button onClick={() => setSelected(null)} style={closeX}>✕</button>
                            {selected.type === 'worker' && (
                                <>
                                    <div style={{ fontSize: 36, marginBottom: 10 }}>👷</div>
                                    <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>{selected.data.name}</h3>
                                    <div style={pill('#dcfce7', '#166534')}>{selected.data.skill || 'Worker'}</div>
                                    <div style={detailRow}><span>📞</span><strong>{selected.data.phone || 'N/A'}</strong></div>
                                    <div style={detailRow}><span>📧</span><span style={{ color: '#64748b', fontSize: 13 }}>{selected.data.email || 'N/A'}</span></div>
                                    <div style={{ ...pill('#dcfce7', '#166534'), marginTop: 10 }}>✅ Available</div>
                                </>
                            )}
                            {selected.type === 'task' && (
                                <>
                                    <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                                    <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>{selected.data.title}</h3>
                                    <div style={pill('#eef2ff', '#4f46e5')}>{selected.data.category}</div>
                                    <div style={detailRow}><span>💰</span><strong style={{ color: '#16a34a' }}>₹{selected.data.budget}</strong></div>
                                    <div style={detailRow}><span>📍</span><span style={{ color: '#64748b', fontSize: 13 }}>{selected.data.address || 'N/A'}</span></div>
                                    <div style={detailRow}><span>👤</span><span style={{ color: '#64748b', fontSize: 13 }}>{selected.data.postedBy?.name || 'Customer'}</span></div>
                                    <p style={{ fontSize: 13, color: '#475569', margin: '10px 0 0' }}>{selected.data.description}</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* List */}
                    <div style={{ maxHeight: 460, overflowY: 'auto' }}>
                        {!isWorker && nearbyWorkers.map((w, i) => (
                            <div key={w.id} onClick={() => setSelected({ type: 'worker', data: w })} style={listCard(selected?.data?.id === w.id)}>
                                <span style={{ fontSize: 24 }}>👷</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{w.name}</div>
                                    <div style={{ color: '#64748b', fontSize: 12 }}>{w.skill || 'Worker'}</div>
                                    <div style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>📞 {w.phone}</div>
                                </div>
                                <span style={{ ...pill('#dcfce7', '#166534'), fontSize: 10 }}>Available</span>
                            </div>
                        ))}
                        {isWorker && nearbyTasks.map((t) => (
                            <div key={t.id} onClick={() => setSelected({ type: 'task', data: t })} style={listCard(selected?.data?.id === t.id)}>
                                <span style={{ fontSize: 24 }}>📋</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{t.title}</div>
                                    <div style={{ color: '#64748b', fontSize: 12 }}>{t.category} · {t.address}</div>
                                    <div style={{ color: '#16a34a', fontSize: 13, fontWeight: 700 }}>₹{t.budget}</div>
                                </div>
                            </div>
                        ))}
                        {!loading && ((isWorker && nearbyTasks.length === 0) || (!isWorker && nearbyWorkers.length === 0)) && (
                            <div style={{ color: '#94a3b8', fontSize: 14, padding: 16, textAlign: 'center' }}>
                                {isWorker ? 'No open tasks near you.' : 'No workers found nearby.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Styles ──
const badge = { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: 11, borderRadius: 999, padding: '5px 12px', letterSpacing: 0.4 };
const legend = { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' };
const legendItem = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 600 };
const dot = { display: 'inline-block', width: 12, height: 12, borderRadius: '50%' };

const infoCard = {
    background: '#fff', border: '2px solid #e2e8f0', borderRadius: 16,
    padding: 20, marginBottom: 12, position: 'relative',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
};
const closeX = {
    position: 'absolute', top: 10, right: 10, background: '#f1f5f9',
    border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#64748b'
};
const detailRow = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 14 };
const pill = (bg, color) => ({ display: 'inline-block', background: bg, color, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700 });
const listCard = (active) => ({
    display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px',
    background: active ? '#eff6ff' : '#fff', borderRadius: 12, marginBottom: 8,
    border: `1.5px solid ${active ? '#93c5fd' : '#e2e8f0'}`, cursor: 'pointer',
    transition: 'all 0.15s', boxShadow: active ? '0 4px 12px rgba(37,99,235,0.1)' : 'none'
});
