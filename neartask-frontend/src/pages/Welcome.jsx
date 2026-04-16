import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const showWelcome = localStorage.getItem('showWelcome') === '1';

    const features = useMemo(() => {
        const common = [
            {
                title: 'Post Task in Seconds',
                desc: 'Create a task with category, budget, and location so nearby users can see it instantly.'
            },
            {
                title: 'Nearby Worker Discovery',
                desc: 'Use live map and geolocation to discover nearby available workers around your area.'
            },
            {
                title: 'Instant Accept and Booking',
                desc: 'Workers can accept open requests quickly and create a structured booking flow.'
            },
            {
                title: 'Task Completion Tracking',
                desc: 'Track task status from OPEN to ASSIGNED to COMPLETED with transparent updates.'
            },
            {
                title: 'Personal Dashboard',
                desc: 'See your posted tasks, accepted bookings, and progress in one place.'
            },
            {
                title: 'Ratings and Reviews',
                desc: 'Customers can review workers after completion to build trust and quality signals.'
            }
        ];

        return common;
    }, []);

    if (!user) return <Navigate to="/login" replace />;
    if (!showWelcome) return <Navigate to="/tasks" replace />;

    const continueToApp = () => {
        localStorage.removeItem('showWelcome');
        navigate('/tasks', { replace: true });
    };

    const openDashboard = () => {
        localStorage.removeItem('showWelcome');
        navigate('/dashboard', { replace: true });
    };

    return (
        <div style={styles.page}>
            <div style={styles.heroGlowOne} />
            <div style={styles.heroGlowTwo} />
            <div style={styles.container}>
                <section style={styles.heroCard}>
                    <span style={styles.badge}>Welcome to NearTask</span>
                    <h1 style={styles.title}>Hyperlocal micro-work platform for real, everyday help</h1>
                    <p style={styles.subtitle}>
                        You are now inside a fast local service exchange where users can post quick jobs and nearby workers can accept and complete them.
                    </p>
                    <div style={styles.ctaRow}>
                        <button style={styles.primaryBtn} onClick={continueToApp}>Explore Tasks</button>
                        <button style={styles.secondaryBtn} onClick={openDashboard}>Open Dashboard</button>
                    </div>
                </section>

                <section style={styles.grid}>
                    {features.map((item) => (
                        <article key={item.title} style={styles.featureCard}>
                            <h3 style={styles.featureTitle}>{item.title}</h3>
                            <p style={styles.featureDesc}>{item.desc}</p>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        position: 'relative',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        overflow: 'hidden',
        paddingBottom: 32
    },
    heroGlowOne: {
        position: 'absolute',
        width: 380,
        height: 380,
        borderRadius: '50%',
        top: -120,
        left: -100,
        background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0) 70%)'
    },
    heroGlowTwo: {
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: '50%',
        right: -120,
        top: 120,
        background: 'radial-gradient(circle, rgba(14,165,233,0.22) 0%, rgba(14,165,233,0) 72%)'
    },
    container: {
        maxWidth: 1100,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
        padding: '28px 16px'
    },
    heroCard: {
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #dbeafe',
        borderRadius: 18,
        padding: 28,
        boxShadow: '0 12px 40px rgba(15,23,42,0.08)',
        marginBottom: 18
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
        fontSize: 36,
        lineHeight: 1.15
    },
    subtitle: {
        margin: '0 0 18px',
        color: '#475569',
        fontSize: 16,
        maxWidth: 760
    },
    ctaRow: {
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap'
    },
    primaryBtn: {
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '11px 18px',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer'
    },
    secondaryBtn: {
        background: '#e2e8f0',
        color: '#0f172a',
        border: 'none',
        borderRadius: 10,
        padding: '11px 18px',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 12,
        marginBottom: 18
    },
    featureCard: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: 16,
        boxShadow: '0 6px 20px rgba(2,6,23,0.05)'
    },
    featureTitle: {
        margin: '0 0 6px',
        color: '#0f172a',
        fontSize: 16
    },
    featureDesc: {
        margin: 0,
        color: '#64748b',
        fontSize: 14,
        lineHeight: 1.4
    }
};
