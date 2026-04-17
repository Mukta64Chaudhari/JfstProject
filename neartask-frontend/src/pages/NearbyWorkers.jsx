import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllTasks, getNearbyWorkers } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };
const WORKER_RADIUS_KM = 20;
const TASK_RADIUS_KM = 15;

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function NearbyMap() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userLoc, setUserLoc] = useState(PUNE_CENTER);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const isWorker = user?.role === 'WORKER';

  const nearbyWorkers = useMemo(
    () =>
      workers.filter(
        (worker) =>
          worker.latitude &&
          worker.longitude &&
          getDistanceKm(userLoc.lat, userLoc.lng, worker.latitude, worker.longitude) <= WORKER_RADIUS_KM
      ),
    [workers, userLoc]
  );

  const nearbyTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.latitude &&
          task.longitude &&
          getDistanceKm(userLoc.lat, userLoc.lng, task.latitude, task.longitude) <= TASK_RADIUS_KM
      ),
    [tasks, userLoc]
  );

  useEffect(() => {
    const load = async (lat, lng) => {
      try {
        const [workersRes, tasksRes] = await Promise.all([
          getNearbyWorkers(lat, lng),
          isWorker ? getAllTasks() : Promise.resolve({ data: [] }),
        ]);

        setWorkers(workersRes.data || []);
        if (isWorker) {
          setTasks((tasksRes.data || []).filter((task) => task.status === 'OPEN'));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLoc(currentLocation);
          load(currentLocation.lat, currentLocation.lng);
        },
        () => {
          load(PUNE_CENTER.lat, PUNE_CENTER.lng);
        }
      );
    } else {
      load(PUNE_CENTER.lat, PUNE_CENTER.lng);
    }
  }, [isWorker]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <span style={badge}>{isWorker ? 'Tasks Near You' : 'Nearby Workers'}</span>
        <h2 style={{ margin: '10px 0 6px', color: '#0f172a', fontSize: 28 }}>
          {isWorker ? 'Open Tasks on Map' : 'Workers Around You'}
        </h2>
        <p style={{ color: '#64748b', margin: 0 }}>
          {loading
            ? 'Fetching location...'
            : isWorker
            ? `${nearbyTasks.length} open task${nearbyTasks.length !== 1 ? 's' : ''} found near you`
            : `${nearbyWorkers.length} worker${nearbyWorkers.length !== 1 ? 's' : ''} available nearby`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px', minWidth: 300 }}>
          <MapContainer
            center={[userLoc.lat, userLoc.lng]}
            zoom={13}
            style={{ height: 480, borderRadius: 16, border: '2px solid #e2e8f0' }}
            scrollWheelZoom={true}
          >
            <ChangeMapView center={[userLoc.lat, userLoc.lng]} zoom={13} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <CircleMarker
              center={[userLoc.lat, userLoc.lng]}
              pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.25 }}
              radius={10}
            >
              <Popup>You are here</Popup>
            </CircleMarker>

            {nearbyWorkers.map((worker) => (
              <CircleMarker
                key={worker.id || `${worker.latitude}-${worker.longitude}`}
                center={[worker.latitude, worker.longitude]}
                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.25 }}
                radius={10}
                eventHandlers={{ click: () => setSelected({ type: 'worker', data: worker }) }}
              >
                <Popup>
                  <div>
                    <strong>{worker.name}</strong>
                    <div>{worker.skill || 'Worker'}</div>
                    <div>{worker.phone || 'No phone'}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {isWorker && nearbyTasks.map((task) => (
              <CircleMarker
                key={task.id || `${task.latitude}-${task.longitude}`}
                center={[task.latitude, task.longitude]}
                pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.25 }}
                radius={10}
                eventHandlers={{ click: () => setSelected({ type: 'task', data: task }) }}
              >
                <Popup>
                  <div>
                    <strong>{task.title}</strong>
                    <div>{task.category}</div>
                    <div>{task.address || 'No address'}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div style={{ flex: '0 0 280px', minWidth: 240 }}>
          {selected && (
            <div style={infoCard}>
              <button style={closeX} onClick={() => setSelected(null)}>
                Close
              </button>
              {selected.type === 'worker' ? (
                <>
                  <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>{selected.data.name}</h3>
                  <div style={pill('#dcfce7', '#166534')}>{selected.data.skill || 'Worker'}</div>
                  <div style={detailRow}>Phone: {selected.data.phone || 'N/A'}</div>
                  <div style={detailRow}>Email: {selected.data.email || 'N/A'}</div>
                </>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>{selected.data.title}</h3>
                  <div style={pill('#eef2ff', '#4f46e5')}>{selected.data.category}</div>
                  <div style={detailRow}>Budget: Rs {selected.data.budget}</div>
                  <div style={detailRow}>Address: {selected.data.address || 'N/A'}</div>
                </>
              )}
            </div>
          )}

          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {!isWorker && nearbyWorkers.map((worker) => (
              <div key={worker.id || `${worker.latitude}-${worker.longitude}`} onClick={() => setSelected({ type: 'worker', data: worker })} style={listCard(selected?.data?.id === worker.id)}>
                <div>
                  <div style={{ fontWeight: 700 }}>{worker.name}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{worker.skill || 'Worker'}</div>
                  <div style={{ color: '#475569', fontSize: 12 }}>Phone: {worker.phone || 'N/A'}</div>
                </div>
              </div>
            ))}

            {isWorker && nearbyTasks.map((task) => (
              <div key={task.id || `${task.latitude}-${task.longitude}`} onClick={() => setSelected({ type: 'task', data: task })} style={listCard(selected?.data?.id === task.id)}>
                <div>
                  <div style={{ fontWeight: 700 }}>{task.title}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{task.category} • {task.address || 'No address'}</div>
                  <div style={{ color: '#16a34a', fontSize: 12 }}>₹{task.budget}</div>
                </div>
              </div>
            ))}

            {!loading && ((isWorker && nearbyTasks.length === 0) || (!isWorker && nearbyWorkers.length === 0)) && (
              <div style={{ color: '#94a3b8', padding: 16, textAlign: 'center' }}>
                {isWorker ? 'No open tasks near you.' : 'No workers found nearby.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const badge = {
  display: 'inline-block',
  background: '#dbeafe',
  color: '#1d4ed8',
  fontWeight: 700,
  fontSize: 11,
  borderRadius: 999,
  padding: '5px 12px',
  letterSpacing: 0.4,
};

const infoCard = {
  background: '#fff',
  border: '2px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  marginBottom: 12,
  position: 'relative',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
};

const closeX = {
  position: 'absolute',
  top: 10,
  right: 10,
  background: '#f1f5f9',
  border: 'none',
  borderRadius: '50%',
  width: 56,
  height: 30,
  cursor: 'pointer',
  fontWeight: 700,
};

const detailRow = {
  marginTop: 8,
  color: '#475569',
  fontSize: 13,
};

const pill = (bg, color) => ({
  display: 'inline-block',
  background: bg,
  color,
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 700,
});

const listCard = (active) => ({
  padding: 14,
  borderRadius: 14,
  border: `1px solid ${active ? '#93c5fd' : '#e2e8f0'}`,
  marginBottom: 10,
  cursor: 'pointer',
  background: active ? '#eff6ff' : '#fff',
});
