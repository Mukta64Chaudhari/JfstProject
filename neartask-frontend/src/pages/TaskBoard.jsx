import { useEffect, useState } from 'react';
import { acceptTask, getAllTasks, updateLocation, getWorkerRating } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './TaskBoard.css';

const SERVICE_CARDS = [
    {
        category: 'Cleaning',
        description: 'Home, kitchen, and room cleaning tasks',
        image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80'
    },
    {
        category: 'Maid',
        description: 'Daily home support and housekeeping help',
        image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=1200&q=80'
    },
    {
        category: 'Appliance Repair',
        description: 'Fix washing machines, refrigerators and more',
        image: 'https://res.cloudinary.com/urbanclap/image/upload/t_high_res_template,q_auto:low,f_auto/w_216,dpr_2,fl_progressive:steep,q_auto:low,f_auto,c_limit/images/supply/customer-app-supply/1682663467876-a0c44c.jpeg'
    },
    {
        category: 'Plumbing',
        description: 'Leak fixes, taps, and bathroom plumbing',
        image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80'
    },
    {
        category: 'Electrical',
        description: 'Appliance and electric point support',
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80'
    },
    {
        category: 'Moving',
        description: 'Furniture and heavy item shifting help',
        image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1200&q=80'
    },
    {
        category: 'Gardening',
        description: 'Yard care, lawn trimming and outdoor help',
        image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80'
    },
    {
        category: 'Delivery',
        description: 'Pickup and drop urgent local items',
        image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&w=1200&q=80'
    },
    {
        category: 'Other',
        description: 'Any custom local service request',
        image: 'https://images.unsplash.com/photo-1521790797524-b2497295b8a0?auto=format&fit=crop&w=1200&q=80'
    }
];

function formatDateTime(value) {
    if (!value) return 'Not specified';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Not specified';
    return dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function detailLine(label, value) {
    return (
        <p style={{ color: '#475569', margin: '6px 0 0', fontSize: 13 }}>
            <span style={{ color: '#0f172a', fontWeight: 700 }}>{label}:</span> {value || 'Not specified'}
        </p>
    );
}

export default function TaskBoard() {
    const { user }  = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks]   = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [workerRatings, setWorkerRatings] = useState({});
    const [rejectedTaskIds, setRejectedTaskIds] = useState([]);
    const [actionMsg, setActionMsg] = useState('');
    const workerSkills = user?.role === 'WORKER'
        ? (Array.isArray(user?.skills) && user.skills.length > 0 ? user.skills : (user?.skill ? [user.skill] : []))
        : [];

    useEffect(() => { 
        if (user?.role === 'WORKER') fetchTasks();
        if (user?.role === 'WORKER' && user?.userId) {
            const key = `rejectedTasks_${user.userId}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setRejectedTaskIds(Array.isArray(parsed) ? parsed : []);
                } catch {
                    setRejectedTaskIds([]);
                }
            }
        }
        // Update user location if worker
        if (user?.role === 'WORKER') {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    await updateLocation(user.userId, pos.coords.latitude, pos.coords.longitude);
                },
                () => console.log('Location access denied')
            );
        }
    }, [user?.role, user?.userId]);

    const fetchTasks = async () => {
        try {
            const { data } = await getAllTasks();
            setTasks(data);
            // Fetch ratings for all workers
            data.forEach(task => {
                if (task.assignedTo?.id && !workerRatings[task.assignedTo.id]) {
                    getWorkerRating(task.assignedTo.id).then(({ data: rating }) => {
                        setWorkerRatings(prev => ({ ...prev, [task.assignedTo.id]: rating }));
                    });
                }
            });
        } catch (err) {
            console.error(err);
        }
    };

    const visibleTasks = user?.role === 'WORKER'
        ? (workerSkills.length > 0 ? tasks.filter(t => workerSkills.includes(t.category) && !rejectedTaskIds.includes(t.id)) : [])
        : tasks;

    const filtered = filter === 'ALL' ? visibleTasks : visibleTasks.filter(t => t.category === filter);

    const openCategoryPost = (category) => {
        navigate('/post-task', { state: { category } });
    };

    const openCustomPost = () => navigate('/post-task');

    const handleAcceptTask = async (taskId) => {
        try {
            await acceptTask(taskId, user.userId);
            setActionMsg('Task accepted successfully. It is now visible in My Tasks.');
            fetchTasks();
        } catch (err) {
            setActionMsg(err?.response?.data || 'Could not accept task. Please try again.');
        }
    };

    const handleRejectTask = (taskId) => {
        const updated = [...rejectedTaskIds, taskId];
        setRejectedTaskIds(updated);
        if (user?.userId) {
            localStorage.setItem(`rejectedTasks_${user.userId}`, JSON.stringify(updated));
        }
        setActionMsg('Task rejected. You can still see other matching tasks.');
    };

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
            {user?.role === 'CUSTOMER' ? (
                <>
                    <section className="customer-hero">
                        <h2 className="customer-title">What do you need help with today?</h2>
                        <p className="customer-subtitle">
                            Select a service card to pre-fill your task. If your service is different, use Post Task for a custom request.
                        </p>
                    </section>

                    <div className="customer-controls">
                        <span className="helper-chip">Choose Service or Post Custom Task</span>
                        <button onClick={openCustomPost} style={styles.btnPrimary}>+ Post Task</button>
                    </div>

                    <section className="service-grid">
                        {SERVICE_CARDS.map((service) => (
                            <article
                                key={service.category}
                                className="service-card"
                                onClick={() => openCategoryPost(service.category)}
                            >
                                <img className="service-image" src={service.image} alt={service.category} />
                                <div className="service-overlay">
                                    <h3 className="service-name">{service.category}</h3>
                                    <p className="service-desc">{service.description}</p>
                                </div>
                            </article>
                        ))}
                    </section>
                </>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, color: '#1e293b' }}>Available Tasks</h2>
                </div>
            )}

            {user?.role === 'CUSTOMER' && (
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 0 }}>Pick a service image to open the posting page. Use Post Task if your service is custom.</p>
            )}

            {user?.role === 'WORKER' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {['ALL', ...workerSkills].map(c => (
                        <button key={c} onClick={() => setFilter(c)} style={{
                            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: filter === c ? '#4f46e5' : '#e2e8f0',
                            color: filter === c ? '#fff' : '#475569', fontSize: 13
                        }}>{c}</button>
                    ))}
                </div>
            )}

            {user?.role === 'WORKER' && workerSkills.length > 0 && (
                <div style={styles.skillNotice}>
                    Showing tasks that match your skills: {workerSkills.join(', ')}.
                </div>
            )}

            {user?.role === 'WORKER' && actionMsg && (
                <div style={styles.success}>{actionMsg}</div>
            )}

            {user?.role === 'WORKER' && workerSkills.length === 0 && (
                <div style={styles.skillWarning}>
                    Please register or update your worker skills first. No tasks are shown until at least one skill is set.
                </div>
            )}

            {user?.role === 'WORKER' && (
                <div style={{ display: 'grid', gap: 16 }}>
                    {filtered.length === 0 && <p style={{ color: '#94a3b8' }}>No tasks found.</p>}
                    {filtered.map(task => (
                        <div key={task.id} style={styles.taskCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>{task.title}</h4>
                                    <p style={{ color: '#64748b', margin: '6px 0', fontSize: 14 }}>{task.description}</p>
                                    {detailLine('Location', task.address)}
                                    {detailLine('Requested At', formatDateTime(task.createdAt))}
                                    {detailLine('Service Scheduled', formatDateTime(task.scheduledAt))}
                                    {task.postedBy && (
                                        detailLine('Request By', `${task.postedBy.name || 'Customer'}${task.postedBy.phone ? ` (${task.postedBy.phone})` : ''}`)
                                    )}
                                    {task.assignedTo && (
                                        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#4f46e5', fontWeight: 500 }}>
                                            👤 {task.assignedTo.name}
                                            {workerRatings[task.assignedTo.id] && (
                                                <span style={{ marginLeft: 8 }}>⭐ {workerRatings[task.assignedTo.id].rating.toFixed(1)} ({workerRatings[task.assignedTo.id].count} reviews)</span>
                                            )}
                                        </p>
                                    )}
                                </div>
                                <span style={{ ...styles.badge, background: '#eef2ff', color: '#4f46e5' }}>{task.category}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                                <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 16 }}>₹{task.budget}</span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {task.status !== 'OPEN' && (
                                        <span style={{
                                            ...styles.badge,
                                            background: task.status === 'ASSIGNED' ? '#fef9c3' : '#f1f5f9',
                                            color: task.status === 'ASSIGNED' ? '#ca8a04' : '#64748b'
                                        }}>{task.status}</span>
                                    )}
                                    {task.status === 'OPEN' && (
                                        <>
                                            <button onClick={() => handleAcceptTask(task.id)} style={styles.actionAccept}>Accept</button>
                                            <button onClick={() => handleRejectTask(task.id)} style={styles.actionReject}>Reject</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    btnPrimary: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
    btnSmall:   { padding: '6px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
    taskCard:   { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 },
    badge:      { padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 },
    actionAccept: { padding: '7px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
    actionReject: { padding: '7px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
    skillNotice:{ background: '#eff6ff', color: '#1d4ed8', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500 },
    skillWarning:{ background: '#fef3c7', color: '#b45309', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500 },
    success:    { background: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500 }
};