import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getNearbyWorkers } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = defaultIcon;

export default function NearbyWorkers() {
    const [workers, setWorkers] = useState([]);
    const [userLoc, setUserLoc] = useState({ lat: 18.5204, lng: 73.8567 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserLoc({ lat, lng });
                const { data } = await getNearbyWorkers(lat, lng);
                setWorkers(data);
                setLoading(false);
            },
            () => {
                getNearbyWorkers(userLoc.lat, userLoc.lng).then(({ data }) => {
                    setWorkers(data);
                    setLoading(false);
                });
            }
        );
    }, []);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
            <h2 style={{ color: '#1e293b', marginBottom: 8 }}>Workers Near You</h2>
            <p style={{ color: '#64748b', marginBottom: 20 }}>
                {loading ? 'Finding your location...' : `${workers.length} workers found nearby`}
            </p>
            <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={13}
                style={{ height: 500, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {workers.map(w => (
                    <Marker key={w.id} position={[w.latitude, w.longitude]}>
                        <Popup>
                            <div style={{ minWidth: 160 }}>
                                <strong>{w.name}</strong><br />
                                <span style={{ color: '#64748b', fontSize: 13 }}>{w.phone}</span><br />
                                <span style={{ color: '#16a34a', fontSize: 13 }}>Available</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}