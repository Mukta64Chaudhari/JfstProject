import { useEffect, useState } from 'react';
import { getAllTasks, createTask, acceptTask } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Cleaning', 'Plumbing', 'Delivery', 'Electrical', 'Moving', 'WiFi Fix', 'Cooking', 'Other'];

export default function TaskBoard() {
    const { user }  = useAuth();
    const [tasks, setTasks]   = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: '', budget: '', address: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        const { data } = await getAllTasks();
        setTasks(data);
    };

    const handlePost = async (e) => {
        e.preventDefault();
        await createTask({
            ...form,
            latitude: 18.5204,
            longitude: 73.8567,
            postedBy: { id: user.userId }
        });
        setMsg('Task posted successfully!');
        setShowForm(false);
        setForm({ title: '', description: '', category: '', budget: '', address: '' });
        fetchTasks();
        setTimeout(() => setMsg(''), 3000);
    };

    const handleAccept = async (taskId) => {
        await acceptTask(taskId, user.userId);
        setMsg('Task accepted!');
        fetchTasks();
        setTimeout(() => setMsg(''), 3000);
    };

    const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.category === filter);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, color: '#1e293b' }}>Available Tasks</h2>
                {user?.role === 'CUSTOMER' && (
                    <button onClick={() => setShowForm(!showForm)} style={styles.btnPrimary}>
                        {showForm ? 'Cancel' : '+ Post Task'}
                    </button>
                )}
            </div>

            {msg && <div style={styles.success}>{msg}</div>}

            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={{ marginTop: 0 }}>Post a New Task</h3>
                    <form onSubmit={handlePost}>
                        <input style={styles.input} placeholder="Task title" value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })} required />
                        <textarea style={{ ...styles.input, height: 80, resize: 'vertical' }}
                            placeholder="Describe the task..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })} required />
                        <select style={styles.input} value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })} required>
                            <option value="">Select category</option>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <input style={styles.input} type="number" placeholder="Budget (₹)"
                            value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} required />
                        <input style={styles.input} placeholder="Your address"
                            value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
                        <button style={styles.btnPrimary} type="submit">Post Task</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {['ALL', ...CATEGORIES].map(c => (
                    <button key={c} onClick={() => setFilter(c)} style={{
                        padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: filter === c ? '#4f46e5' : '#e2e8f0',
                        color: filter === c ? '#fff' : '#475569', fontSize: 13
                    }}>{c}</button>
                ))}
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
                {filtered.length === 0 && <p style={{ color: '#94a3b8' }}>No tasks found.</p>}
                {filtered.map(task => (
                    <div key={task.id} style={styles.taskCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ margin: 0, color: '#1e293b' }}>{task.title}</h4>
                                <p style={{ color: '#64748b', margin: '6px 0', fontSize: 14 }}>{task.description}</p>
                                <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>{task.address}</p>
                            </div>
                            <span style={{ ...styles.badge, background: '#eef2ff', color: '#4f46e5' }}>{task.category}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 16 }}>₹{task.budget}</span>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{
                                    ...styles.badge,
                                    background: task.status === 'OPEN' ? '#dcfce7' : task.status === 'ASSIGNED' ? '#fef9c3' : '#f1f5f9',
                                    color: task.status === 'OPEN' ? '#16a34a' : task.status === 'ASSIGNED' ? '#ca8a04' : '#64748b'
                                }}>{task.status}</span>
                                {user?.role === 'WORKER' && task.status === 'OPEN' && (
                                    <button onClick={() => handleAccept(task.id)} style={styles.btnSmall}>
                                        Accept Task
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    btnPrimary: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
    btnSmall:   { padding: '6px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
    input:      { display: 'block', width: '100%', padding: '10px 14px', marginBottom: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
    formCard:   { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 },
    taskCard:   { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 },
    badge:      { padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 },
    success:    { background: '#dcfce7', color: '#16a34a', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }
};