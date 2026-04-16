import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [hovered, setHovered] = useState('');

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <Link to="/tasks" style={styles.brand}>NearTask</Link>
            <div style={styles.linksWrap}>
                {user ? (
                    <>
                        <Link
                            to="/welcome"
                            onMouseEnter={() => setHovered('welcome')}
                            onMouseLeave={() => setHovered('')}
                            style={getLinkStyle(location.pathname === '/welcome', hovered === 'welcome')}
                        >
                            Home
                        </Link>
                        <Link
                            to="/nearby"
                            onMouseEnter={() => setHovered('nearby')}
                            onMouseLeave={() => setHovered('')}
                            style={getLinkStyle(location.pathname === '/nearby', hovered === 'nearby')}
                        >
                            Nearby
                        </Link>
                        <Link
                            to="/my-tasks"
                            onMouseEnter={() => setHovered('my-tasks')}
                            onMouseLeave={() => setHovered('')}
                            style={getLinkStyle(location.pathname === '/my-tasks' || location.pathname === '/dashboard', hovered === 'my-tasks')}
                        >
                            My Tasks
                        </Link>
                        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" onMouseEnter={() => setHovered('login')} onMouseLeave={() => setHovered('')} style={getLinkStyle(location.pathname === '/login', hovered === 'login')}>Login</Link>
                        <Link to="/login?mode=register" onMouseEnter={() => setHovered('register')} onMouseLeave={() => setHovered('')} style={getLinkStyle(location.pathname === '/register' || location.search === '?mode=register', hovered === 'register')}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

function getLinkStyle(active, hovered) {
    return {
        color: active || hovered ? '#fff' : '#475569',
        textDecoration: 'none',
        fontSize: 14,
        padding: '8px 14px',
        borderRadius: 999,
        background: active || hovered ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' : 'transparent',
        boxShadow: active || hovered ? '0 8px 20px rgba(37,99,235,0.22)' : 'none',
        transition: 'all 0.2s ease'
    };
}

const styles = {
    nav:       { position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0' },
    brand:     { fontWeight: 800, fontSize: 21, color: '#1d4ed8', textDecoration: 'none', letterSpacing: '-0.02em' },
    linksWrap: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' },
    logoutBtn: { padding: '8px 14px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#b91c1c', border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 700 }
};