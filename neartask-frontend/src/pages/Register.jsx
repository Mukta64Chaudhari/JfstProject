import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [form, setForm]   = useState({ name: '', email: '', password: '', phone: '', role: 'CUSTOMER' });
    const [error, setError] = useState('');
    const { loginUser }     = useAuth();
    const navigate          = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await register(form);
            loginUser(data);
            navigate('/tasks');
        } catch {
            setError('Registration failed. Email may already be used.');
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create Account</h2>
                <p style={styles.sub}>Join NearTask today</p>
                {error && <p style={styles.error}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input style={styles.input} placeholder="Full Name"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    <input style={styles.input} type="email" placeholder="Email"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    <input style={styles.input} type="password" placeholder="Password"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    <input style={styles.input} placeholder="Phone Number"
                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    <select style={styles.input} value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}>
                        <option value="CUSTOMER">Customer — I need tasks done</option>
                        <option value="WORKER">Worker — I complete tasks</option>
                    </select>
                    <button style={styles.btn} type="submit">Register</button>
                </form>
                <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
                    Already have account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' },
    card:    { background: '#fff', padding: 40, borderRadius: 12, width: 380, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
    title:   { margin: 0, fontSize: 24, fontWeight: 600, color: '#1e293b' },
    sub:     { color: '#64748b', marginTop: 4, marginBottom: 24 },
    input:   { display: 'block', width: '100%', padding: '10px 14px', marginBottom: 14, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
    btn:     { width: '100%', padding: 12, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
    error:   { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 14 }
};