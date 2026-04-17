import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTask } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Cleaning', 'Maid', 'Appliance Repair', 'Plumbing', 'Electrical', 'Moving', 'Gardening', 'Delivery', 'Other'];

function getDefaultScheduledAt() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function PostTask() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const selectedCategory = location.state?.category || '';
    const lockedCategory = Boolean(selectedCategory);

    const [form, setForm] = useState({ description: '', category: selectedCategory, budget: '', address: '', receiverAddress: '', receiverPhone: '', scheduledAt: getDefaultScheduledAt() });
    const [msg, setMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isDelivery = (form.category || selectedCategory) === 'Delivery';

    useEffect(() => {
        setForm((prev) => ({ ...prev, category: selectedCategory || prev.category }));
    }, [selectedCategory]);

    const minDateTime = (() => {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        return local;
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const normalizedScheduledAt = form.scheduledAt
                ? (form.scheduledAt.length === 16 ? `${form.scheduledAt}:00` : form.scheduledAt)
                : null;

            const finalDescription = isDelivery
                ? `${form.description}\nReceiver Address: ${form.receiverAddress}\nReceiver Phone: ${form.receiverPhone}`
                : form.description;

            await createTask({
                title: `${form.category || 'Custom'} request`,
                description: finalDescription,
                category: form.category,
                budget: form.budget,
                address: form.address,
                scheduledAt: normalizedScheduledAt,
                latitude: 18.5204,
                longitude: 73.8567,
                postedBy: { id: user.userId }
            });
            setMsg('Task posted successfully. Returning to services...');
            localStorage.setItem('taskBoardFlash', '1');
            setTimeout(() => {
                navigate('/tasks', { replace: true });
            }, 900);
        } catch (error) {
            setMsg('Failed to post task. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.shell}>
                <button onClick={() => navigate('/tasks')} style={styles.backBtn}>← Back to Services</button>
                <div style={styles.hero}>
                    <span style={styles.badge}>{selectedCategory ? `${selectedCategory} task` : 'Custom task'}</span>
                    <h1 style={styles.title}>{selectedCategory ? `Post a ${selectedCategory} request` : 'Post your custom request'}</h1>
                    <p style={styles.subtitle}>Fill in a few quick details and your request will be ready for the right service flow.</p>
                </div>

                {msg && <div style={styles.notice}>{msg}</div>}

                <form onSubmit={handleSubmit} style={styles.card}>
                    <label style={styles.label}>Task Description</label>
                    <textarea style={{ ...styles.input, height: 100, resize: 'vertical' }} placeholder="Describe the task" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />

                    <label style={styles.label}>Service Category</label>
                    {lockedCategory ? (
                        <div style={styles.lockedCategory}>
                            {selectedCategory}
                        </div>
                    ) : (
                        <select style={styles.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                            <option value="">Select category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}

                    <label style={styles.label}>Budget</label>
                    <input style={styles.input} type="number" placeholder="Budget (₹)" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} required />

                    <label style={styles.label}>{isDelivery ? 'Pickup Address / Area' : 'Address / Area'}</label>
                    <input style={styles.input} placeholder={isDelivery ? 'Pickup address / area' : 'Address / area'} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />

                    <label style={styles.label}>Preferred Date & Time</label>
                    <div style={styles.dateWrap}>
                        <input
                            style={{ ...styles.input, marginBottom: 6 }}
                            type="datetime-local"
                            min={minDateTime}
                            value={form.scheduledAt}
                            onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                            required
                        />
                        <p style={styles.helper}>Choose your preferred service slot. Worker and customer both will see this.</p>
                    </div>

                    {isDelivery && (
                        <>
                            <label style={styles.label}>Receiver Address</label>
                            <input
                                style={styles.input}
                                placeholder="Receiver address"
                                value={form.receiverAddress}
                                onChange={e => setForm({ ...form, receiverAddress: e.target.value })}
                                required
                            />

                            <label style={styles.label}>Receiver Phone Number</label>
                            <input
                                style={styles.input}
                                type="tel"
                                placeholder="Receiver phone number"
                                value={form.receiverPhone}
                                onChange={e => setForm({ ...form, receiverPhone: e.target.value })}
                                required
                            />
                        </>
                    )}

                    <button style={styles.primaryBtn} type="submit" disabled={submitting}>
                        {submitting ? 'Posting...' : 'Post Task'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '24px 16px'
    },
    shell: {
        maxWidth: 900,
        margin: '0 auto'
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: '#2563eb',
        fontWeight: 700,
        cursor: 'pointer',
        marginBottom: 16,
        fontSize: 14
    },
    hero: {
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid #dbeafe',
        borderRadius: 18,
        padding: 24,
        boxShadow: '0 12px 40px rgba(15,23,42,0.08)',
        marginBottom: 16
    },
    badge: {
        display: 'inline-block',
        background: '#dbeafe',
        color: '#1d4ed8',
        fontWeight: 700,
        fontSize: 12,
        borderRadius: 999,
        padding: '6px 12px',
        letterSpacing: 0.3,
        marginBottom: 10
    },
    title: {
        margin: '0 0 10px',
        color: '#0f172a',
        fontSize: 32,
        lineHeight: 1.15
    },
    subtitle: {
        margin: 0,
        color: '#475569',
        fontSize: 15
    },
    notice: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 14,
        fontWeight: 600
    },
    card: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 18,
        padding: 22,
        boxShadow: '0 10px 24px rgba(2, 6, 23, 0.06)'
    },
    input: {
        display: 'block',
        width: '100%',
        padding: '12px 14px',
        marginBottom: 12,
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        fontSize: 14,
        boxSizing: 'border-box'
    },
    label: {
        display: 'block',
        marginBottom: 8,
        color: '#0f172a',
        fontSize: 13,
        fontWeight: 700
    },
    dateWrap: {
        marginBottom: 12,
        padding: '10px 10px 8px',
        border: '1px solid #dbeafe',
        borderRadius: 10,
        background: '#f8fbff'
    },
    helper: {
        margin: 0,
        fontSize: 12,
        color: '#64748b'
    },
    lockedCategory: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '12px 14px',
        marginBottom: 12,
        border: '1px solid #bfdbfe',
        borderRadius: 10,
        fontSize: 14,
        boxSizing: 'border-box',
        background: '#eff6ff',
        color: '#1d4ed8',
        fontWeight: 700
    },
    primaryBtn: {
        width: '100%',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        fontSize: 15,
        fontWeight: 700
    }
};
