import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';
import { useAuth } from '../context/AuthContext';

const roleOptions = [
    {
        value: 'CUSTOMER',
        title: 'Customer',
        description: 'Post tasks and manage bookings',
        accent: '#2563eb'
    },
    {
        value: 'WORKER',
        title: 'Worker',
        description: 'Pick matching local jobs',
        accent: '#f59e0b'
    }
];

const workerSkills = ['Cleaning', 'Plumbing', 'Delivery', 'Electrical', 'Moving', 'WiFi Fix', 'Cooking', 'Painting', 'Other'];
const SAVED_LOGIN_KEY = 'savedLoginCredentials';

export default function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginUser } = useAuth();
    const isRegister = new URLSearchParams(location.search).get('mode') === 'register';
    const mode = isRegister ? 'register' : 'login';

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', phone: '', role: 'CUSTOMER', skills: [] });
    const [error, setError] = useState('');
    const [savedCredentials, setSavedCredentials] = useState([]);

    useEffect(() => {
        if (mode !== 'login') {
            setSavedCredentials([]);
            return;
        }

        const stored = localStorage.getItem(SAVED_LOGIN_KEY);
        if (!stored) {
            setSavedCredentials([]);
            return;
        }

        try {
            const parsed = JSON.parse(stored);
            setSavedCredentials(Array.isArray(parsed) ? parsed : []);
        } catch {
            setSavedCredentials([]);
        }
    }, [mode]);

    const persistSavedCredential = (email, password) => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) return;

        const nextEntry = { email: trimmedEmail, password, savedAt: new Date().toISOString() };
        const existing = savedCredentials.filter((item) => item.email !== trimmedEmail);
        const nextList = [nextEntry, ...existing].slice(0, 5);
        setSavedCredentials(nextList);
        localStorage.setItem(SAVED_LOGIN_KEY, JSON.stringify(nextList));
    };

    const applySavedCredential = (credential) => {
        setLoginForm({ email: credential.email || '', password: credential.password || '' });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await login(loginForm);
            persistSavedCredential(loginForm.email, loginForm.password);
            loginUser(data);
            navigate('/tasks');
        } catch {
            setError('Invalid email or password');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (registerForm.role === 'WORKER' && registerForm.skills.length === 0) {
            setError('Please select at least one worker skill.');
            return;
        }
        try {
            const payload = {
                ...registerForm,
                skill: registerForm.skills[0] || ''
            };
            const { data } = await register(payload);
            loginUser(data);
            navigate('/tasks');
        } catch {
            setError('Registration failed. Email may already be used.');
        }
    };

    const toggleWorkerSkill = (skill) => {
        setRegisterForm((prev) => {
            const exists = prev.skills.includes(skill);
            return {
                ...prev,
                skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill]
            };
        });
    };

    return (
        <div style={styles.page}>
            <div style={styles.glowA} />
            <div style={styles.glowB} />
            <div style={styles.shell}>
                <aside style={styles.brandPane}>
                    <div style={styles.brandTop}>NearTask</div>
                    <h1 style={styles.brandTitle}>Fast local help for everyday work.</h1>
                    <p style={styles.brandText}>
                        Post small tasks, discover nearby service requests, and manage your local work in one place.
                    </p>
                    <div style={styles.tagRow}>
                        <span style={styles.tag}>Post tasks</span>
                        <span style={styles.tag}>Nearby help</span>
                        <span style={styles.tag}>Instant booking</span>
                    </div>
                </aside>

                <section style={styles.formPane}>
                    <div style={styles.formCard}>
                        <span style={styles.badge}>{mode === 'login' ? 'Welcome back' : 'Create account'}</span>
                        <h2 style={styles.formTitle}>{mode === 'login' ? 'Login now' : 'Sign up now'}</h2>
                        <p style={styles.formSubtitle}>
                            {mode === 'login'
                                ? 'Sign in to continue managing tasks and bookings.'
                                : 'Create your account to start posting or accepting local tasks.'}
                        </p>

                        {error && <div style={styles.error}>{error}</div>}

                        {mode === 'login' ? (
                            <form onSubmit={handleLogin}>
                                <label style={styles.label}>Email</label>
                                <input
                                    style={styles.input}
                                    type="email"
                                    placeholder="Enter your email"
                                    value={loginForm.email}
                                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                                    required
                                />

                                <label style={styles.label}>Password</label>
                                <input
                                    style={styles.input}
                                    type="password"
                                    placeholder="Enter your password"
                                    value={loginForm.password}
                                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                    required
                                />

                                {savedCredentials.length > 0 && (
                                    <div style={styles.savedWrap}>
                                        <div style={styles.savedTitle}>Saved logins</div>
                                        <div style={styles.savedList}>
                                            {savedCredentials.map((credential) => (
                                                <button
                                                    key={credential.email}
                                                    type="button"
                                                    onClick={() => applySavedCredential(credential)}
                                                    style={styles.savedCard}
                                                >
                                                    <span style={styles.savedEmail}>{credential.email}</span>
                                                    <span style={styles.savedPassword}>Password: {credential.password}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button style={styles.primaryBtn} type="submit">Login</button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister}>
                                <label style={styles.label}>Full Name</label>
                                <input
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    value={registerForm.name}
                                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                                    required
                                />

                                <label style={styles.label}>Email</label>
                                <input
                                    style={styles.input}
                                    type="email"
                                    placeholder="Enter your email"
                                    value={registerForm.email}
                                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                                    required
                                />

                                <label style={styles.label}>Password</label>
                                <input
                                    style={styles.input}
                                    type="password"
                                    placeholder="Create a password"
                                    value={registerForm.password}
                                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                                    required
                                />

                                <label style={styles.label}>Phone Number</label>
                                <input
                                    style={styles.input}
                                    placeholder="Enter your phone number"
                                    value={registerForm.phone}
                                    onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                                />

                                <label style={styles.label}>Account Type</label>
                                <div style={styles.roleGrid}>
                                    {roleOptions.map((option) => {
                                        const active = registerForm.role === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setRegisterForm({ ...registerForm, role: option.value, skills: option.value === 'CUSTOMER' ? [] : registerForm.skills })}
                                                style={{
                                                    ...styles.roleCard,
                                                    borderColor: active ? option.accent : '#dbe4f0',
                                                    background: active
                                                        ? `linear-gradient(135deg, ${option.accent}15 0%, rgba(255,255,255,0.96) 100%)`
                                                        : '#fff',
                                                    boxShadow: active ? `0 12px 24px ${option.accent}22` : 'none'
                                                }}
                                            >
                                                <span style={{ ...styles.roleTitle, color: option.accent }}>{option.title}</span>
                                                <span style={styles.roleDescription}>{option.description}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {registerForm.role === 'WORKER' && (
                                    <>
                                        <label style={styles.label}>Worker Skills (Select multiple)</label>
                                        <div style={styles.skillsGrid}>
                                            {workerSkills.map((skill) => {
                                                const selected = registerForm.skills.includes(skill);
                                                return (
                                                    <button
                                                        key={skill}
                                                        type="button"
                                                        onClick={() => toggleWorkerSkill(skill)}
                                                        style={{
                                                            ...styles.skillChip,
                                                            background: selected ? 'linear-gradient(135deg, #f59e0b 0%, #4f46e5 100%)' : '#fff',
                                                            color: selected ? '#fff' : '#475569',
                                                            borderColor: selected ? '#4f46e5' : '#cbd5e1'
                                                        }}
                                                    >
                                                        {skill}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p style={styles.skillHint}>
                                            Selected: {registerForm.skills.length > 0 ? registerForm.skills.join(', ') : 'None'}
                                        </p>
                                    </>
                                )}

                                <button style={styles.primaryBtn} type="submit">Register</button>
                            </form>
                        )}

                        <p style={styles.footerText}>
                            {mode === 'login' ? 'No account yet? ' : 'Already have an account? '}
                            <Link to={mode === 'login' ? '/login?mode=register' : '/login'} style={styles.link}>
                                {mode === 'login' ? 'Create one' : 'Login'}
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
    },
    glowA: {
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: '50%',
        top: -120,
        left: -90,
        background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0) 70%)'
    },
    glowB: {
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: '50%',
        bottom: -140,
        right: -120,
        background: 'radial-gradient(circle, rgba(14,165,233,0.22) 0%, rgba(14,165,233,0) 72%)'
    },
    shell: {
        position: 'relative',
        zIndex: 2,
        maxWidth: 1260,
        minHeight: '100vh',
        margin: '0 auto',
        padding: 14,
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        gap: 14,
        alignItems: 'stretch'
    },
    brandPane: {
        borderRadius: 24,
        padding: 28,
        color: '#0f172a',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.72) 0%, rgba(219,234,254,0.92) 100%)',
        border: '1px solid rgba(191,219,254,0.9)',
        boxShadow: '0 24px 60px rgba(15,23,42,0.12)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    brandTop: {
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        padding: '8px 14px',
        borderRadius: 999,
        background: '#1d4ed8',
        color: '#fff',
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 0.4,
        marginBottom: 18
    },
    brandTitle: {
        margin: '0 0 14px',
        fontSize: 40,
        lineHeight: 1.05,
        fontWeight: 800,
        maxWidth: 520,
        letterSpacing: '-0.03em'
    },
    brandText: {
        margin: 0,
        maxWidth: 520,
        color: '#334155',
        fontSize: 18,
        lineHeight: 1.6
    },
    tagRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 24
    },
    tag: {
        padding: '8px 14px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.75)',
        color: '#1d4ed8',
        fontWeight: 700,
        border: '1px solid rgba(191,219,254,0.8)'
    },
    formPane: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    formCard: {
        width: '100%',
        maxWidth: 520,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #e2e8f0',
        borderRadius: 24,
        padding: 28,
        boxShadow: '0 20px 50px rgba(15,23,42,0.12)'
    },
    badge: {
        display: 'inline-block',
        background: '#dbeafe',
        color: '#1d4ed8',
        fontWeight: 800,
        fontSize: 12,
        borderRadius: 999,
        padding: '6px 12px',
        marginBottom: 10
    },
    formTitle: {
        margin: '0 0 8px',
        fontSize: 34,
        color: '#0f172a',
        lineHeight: 1.1
    },
    formSubtitle: {
        margin: '0 0 20px',
        color: '#64748b',
        fontSize: 15
    },
    label: {
        display: 'block',
        marginBottom: 8,
        color: '#0f172a',
        fontSize: 13,
        fontWeight: 700
    },
    input: {
        display: 'block',
        width: '100%',
        padding: '12px 14px',
        marginBottom: 14,
        border: '1px solid #cbd5e1',
        borderRadius: 12,
        fontSize: 14,
        boxSizing: 'border-box',
        outline: 'none',
        background: '#fff'
    },
    savedWrap: {
        marginBottom: 14,
        padding: 12,
        borderRadius: 14,
        border: '1px solid #dbeafe',
        background: '#eff6ff'
    },
    savedTitle: {
        fontSize: 12,
        fontWeight: 800,
        color: '#1d4ed8',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.4
    },
    savedList: {
        display: 'grid',
        gap: 8
    },
    savedCard: {
        width: '100%',
        textAlign: 'left',
        border: '1px solid #bfdbfe',
        borderRadius: 12,
        background: '#fff',
        padding: '10px 12px',
        cursor: 'pointer',
        display: 'grid',
        gap: 4
    },
    savedEmail: {
        fontSize: 13,
        fontWeight: 800,
        color: '#0f172a'
    },
    savedPassword: {
        fontSize: 12,
        color: '#475569'
    },
    primaryBtn: {
        width: '100%',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        cursor: 'pointer',
        fontSize: 15,
        fontWeight: 800,
        marginTop: 4
    },
    footerText: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 14,
        color: '#475569'
    },
    link: {
        color: '#2563eb',
        fontWeight: 700,
        textDecoration: 'none'
    },
    error: {
        background: '#fee2e2',
        color: '#b91c1c',
        padding: '10px 14px',
        borderRadius: 12,
        marginBottom: 14,
        fontSize: 14,
        fontWeight: 600
    },
    roleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
        marginBottom: 14
    },
    roleCard: {
        width: '100%',
        textAlign: 'left',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 16,
        padding: '14px 14px 13px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    roleTitle: {
        display: 'block',
        fontSize: 16,
        fontWeight: 800,
        marginBottom: 6
    },
    roleDescription: {
        display: 'block',
        fontSize: 13,
        lineHeight: 1.45,
        color: '#475569'
    },
    skillsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
        marginBottom: 8
    },
    skillChip: {
        border: '1px solid #cbd5e1',
        borderRadius: 999,
        padding: '8px 10px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer'
    },
    skillHint: {
        margin: '0 0 14px',
        fontSize: 12,
        color: '#64748b'
    }
};