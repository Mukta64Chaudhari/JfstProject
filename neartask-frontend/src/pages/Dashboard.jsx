import { useEffect, useState } from 'react';
import { getMyTasks, getWorkerBookings, completeBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user, logoutUser } = useAuth();
    const [items, setItems]    = useState([]);

    useEffect(() => {
        if (user?.role === 'CUSTOMER') {
            getMyTasks(user.userId).then(({ data }) => setItems(data));
        } else {
            getWorkerBookings(user.userId).then(({ data }) => setItems(data));
        }
    }, []);

    const handleComplete = async (id) => {
        await completeBooking(id);
        getWorkerBookings(user.userId).then(({ data }) => setItems(data));
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1e293b' }}>My Dashboard</h2>
                    <p style={{ color: '#64748b', margin: '4px 0 0' }}>Welcome, {user?.name} ({user?.role})</p>
                </div>
                <button onClick={logoutUser} style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    Logout
                </button>
            </div>

            <h3 style={{ color: '#374151' }}>{user?.role === 'CUSTOMER' ? 'My Posted Tasks' : 'My Bookings'}</h3>

            <div style={{ display: 'grid', gap: 14 }}>
                {items.length === 0 && <p style={{ color: '#94a3b8' }}>Nothing here yet.</p>}
                {items.map(item => {
                    const task = user?.role === 'CUSTOMER' ? item : item.task;
                    return (
                        <div key={item.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{task?.title}</h4>
                                    <p style={{ color: '#64748b', margin: '4px 0', fontSize: 14 }}>{task?.description}</p>
                                </div>
                                <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, height: 'fit-content',
                                    background: item.status === 'OPEN' || item.status === 'ACCEPTED' ? '#dcfce7' : '#f1f5f9',
                                    color: item.status === 'OPEN' || item.status === 'ACCEPTED' ? '#16a34a' : '#64748b'
                                }}>{item.status}</span>
                            </div>
                            {user?.role === 'WORKER' && item.status === 'ACCEPTED' && (
                                <button onClick={() => handleComplete(item.id)}
                                    style={{ marginTop: 12, padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                                    Mark as Complete
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}