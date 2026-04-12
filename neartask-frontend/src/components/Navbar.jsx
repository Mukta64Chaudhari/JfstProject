import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <Link to="/tasks" style={styles.brand}>NearTask</Link>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {user ? (
                    <>
                        <Link to="/tasks"   style={styles.link}>Tasks</Link>
                        <Link to="/nearby"  style={styles.link}>Nearby</Link>
                        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login"    style={styles.link}>Login</Link>
                        <Link to="/register" style={styles.link}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

const styles = {
    nav:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', background: '#fff', borderBottom: '1px solid #e2e8f0' },
    brand:     { fontWeight: 700, fontSize: 20, color: '#4f46e5', textDecoration: 'none' },
    link:      { color: '#475569', textDecoration: 'none', fontSize: 14, padding: '6px 12px', borderRadius: 6 },
    logoutBtn: { padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }
};