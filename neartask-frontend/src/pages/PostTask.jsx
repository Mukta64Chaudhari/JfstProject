import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTask } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AlertDialog from '../components/AlertDialog';

const CATEGORIES = ['Cleaning', 'Plumbing', 'Delivery', 'Electrical', 'Moving', 'WiFi Fix', 'Cooking', 'Painting', 'Other'];
const CATEGORY_ICONS = { Cleaning: '🧹', Plumbing: '🔧', Delivery: '📦', Electrical: '⚡', Moving: '🚚', 'WiFi Fix': '📡', Cooking: '🍳', Painting: '🖌️', Other: '✨' };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINS = ['00','15','30','45'];

function getDefaultDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now;
}

function toLocalDatetime(value) {
    if (!value) return getDefaultDateTime();
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return getDefaultDateTime();
    return dt;
}

function formatDisplayDateTime(dt) {
    if (!dt) return 'Not selected';
    return dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function buildISOString(year, month, day, hour12, minute, ampm) {
    let h = parseInt(hour12);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const pad = n => String(n).padStart(2, '0');
    return `${year}-${pad(month + 1)}-${pad(day)}T${pad(h)}:${pad(minute)}:00`;
}

export default function PostTask() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const selectedCategory = location.state?.category || '';
    const templateTask = location.state?.templateTask || null;
    const lockedCategory = Boolean(selectedCategory);
    const isRepost = Boolean(templateTask);

    const initDt = toLocalDatetime(templateTask?.scheduledAt);
    const initH = initDt.getHours();
    const initAmPm = initH >= 12 ? 'PM' : 'AM';
    const initH12 = initH % 12 || 12;

    const [form, setForm] = useState({
        description: templateTask?.description || '',
        category: selectedCategory || templateTask?.category || '',
        budget: templateTask?.budget || '',
        address: templateTask?.address || '',
        receiverAddress: templateTask?.receiverAddress || '',
        receiverPhone: templateTask?.receiverPhone || '',
    });

    // Date picker state
    const [dtYear,   setDtYear]   = useState(initDt.getFullYear());
    const [dtMonth,  setDtMonth]  = useState(initDt.getMonth());
    const [dtDay,    setDtDay]    = useState(initDt.getDate());
    const [dtHour,   setDtHour]   = useState(String(initH12).padStart(2, '0'));
    const [dtMin,    setDtMin]    = useState(MINS.includes(String(initDt.getMinutes()).padStart(2,'0')) ? String(initDt.getMinutes()).padStart(2,'0') : '00');
    const [dtAmPm,   setDtAmPm]   = useState(initAmPm);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(templateTask?.latitude && templateTask?.longitude ? {
        lat: templateTask.latitude,
        lng: templateTask.longitude
    } : null);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const isDelivery = (form.category || selectedCategory) === 'Delivery';
    const todayDate = new Date();

    const daysInMonth = new Date(dtYear, dtMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const years = Array.from({ length: 3 }, (_, i) => todayDate.getFullYear() + i);

    const scheduledISO = buildISOString(dtYear, dtMonth, dtDay, dtHour, parseInt(dtMin), dtAmPm);
    const scheduledDisplay = formatDisplayDateTime(new Date(scheduledISO));

    useEffect(() => {
        setForm(prev => ({ ...prev, category: selectedCategory || prev.category }));
    }, [selectedCategory]);

    useEffect(() => {
        if (!form.address || form.address.length < 3) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address)}&format=json&addressdetails=1&limit=5`,
                    { signal: controller.signal }
                );
                const data = await response.json();
                setSuggestions(data.map(item => ({
                    id: item.place_id,
                    label: item.display_name,
                    lat: item.lat,
                    lng: item.lon
                })));
                setSuggestionsOpen(true);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Location autocomplete error:', error);
                }
            } finally {
                setSearchLoading(false);
            }
        }, 400);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [form.address]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const finalDescription = isDelivery
                ? `${form.description}\nReceiver Address: ${form.receiverAddress}\nReceiver Phone: ${form.receiverPhone}`
                : form.description;
            await createTask({
                title: `${form.category || 'Custom'} request`,
                description: finalDescription,
                category: form.category,
                budget: form.budget,
                address: form.address,
                scheduledAt: scheduledISO,
                latitude: selectedLocation ? Number(selectedLocation.lat) : 18.5204,
                longitude: selectedLocation ? Number(selectedLocation.lng) : 73.8567,
                postedBy: { id: user.userId }
            });
            setAlert({
                type: 'success',
                title: isRepost ? '🔁 Task Reposted!' : '🎉 Task Posted!',
                message: isRepost
                    ? 'Your task has been reposted. Workers will be able to see it shortly.'
                    : 'Your task has been posted successfully. Workers near you will start accepting it.',
                redirect: true
            });
        } catch {
            setAlert({ type: 'error', title: 'Failed to Post', message: 'Could not post task. Please try again.' });
            setSubmitting(false);
        }
    };

    const sel = { ...styles.input, cursor: 'pointer' };

    return (
        <div style={styles.page}>
            <div style={styles.shell}>
                <button onClick={() => navigate('/tasks')} style={styles.backBtn}>← Back to Services</button>

                <div style={styles.hero}>
                    <span style={styles.badge}>{CATEGORY_ICONS[form.category] || '📝'} {isRepost ? 'Repost task' : selectedCategory ? `${selectedCategory} task` : 'Custom task'}</span>
                    <h1 style={styles.title}>{isRepost ? 'Edit & Repost Task' : selectedCategory ? `Post a ${selectedCategory} request` : 'Post your custom request'}</h1>
                    <p style={styles.subtitle}>Fill in the details and get help from a nearby worker.</p>
                </div>

                <form onSubmit={handleSubmit} style={styles.card}>
                    {/* Description */}
                    <label style={styles.label}>📝 Task Description</label>
                    <textarea style={{ ...styles.input, height: 100, resize: 'vertical' }} placeholder="Describe what you need..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />

                    {/* Category */}
                    <label style={styles.label}>🗂 Service Category</label>
                    {lockedCategory ? (
                        <div style={styles.lockedCategory}>{CATEGORY_ICONS[selectedCategory]} {selectedCategory}</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 14 }}>
                            {CATEGORIES.map(c => (
                                <div key={c} onClick={() => setForm({ ...form, category: c })} style={{
                                    padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
                                    border: `2px solid ${form.category === c ? '#2563eb' : '#e2e8f0'}`,
                                    background: form.category === c ? '#eff6ff' : '#f8fafc',
                                    color: form.category === c ? '#1d4ed8' : '#475569'
                                }}>
                                    <div style={{ fontSize: 20 }}>{CATEGORY_ICONS[c]}</div>
                                    <div style={{ marginTop: 4 }}>{c}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Budget */}
                    <label style={styles.label}>💰 Budget (₹)</label>
                    <div style={{ position: 'relative', marginBottom: 14 }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: 16 }}>₹</span>
                        <input style={{ ...styles.input, paddingLeft: 30, marginBottom: 0 }} type="number" placeholder="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} required />
                    </div>

                    {/* Address */}
                    <label style={styles.label}>📍 {isDelivery ? 'Pickup Address / Area' : 'Your Address / Area'}</label>
                    <div style={{ position: 'relative', marginBottom: 14 }}>
                        <input
                            style={styles.input}
                            placeholder="Enter area or full address"
                            value={form.address}
                            onChange={e => {
                                setForm({ ...form, address: e.target.value });
                                setSelectedLocation(null);
                            }}
                            onFocus={() => { if (suggestions.length > 0) setSuggestionsOpen(true); }}
                            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                            required
                        />
                        {suggestionsOpen && (
                            <div style={styles.suggestionBox}>
                                {searchLoading ? (
                                    <div style={styles.suggestionItem}>Searching locations…</div>
                                ) : suggestions.length > 0 ? (
                                    suggestions.map(item => (
                                        <div
                                            key={item.id}
                                            style={styles.suggestionItem}
                                            onMouseDown={e => {
                                                e.preventDefault();
                                                setForm(prev => ({ ...prev, address: item.label }));
                                                setSelectedLocation({ lat: item.lat, lng: item.lng });
                                                setSuggestions([]);
                                                setSuggestionsOpen(false);
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Select this location</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={styles.suggestionItem}>No matching locations found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Date & Time Picker ── */}
                    <label style={styles.label}>📅 Preferred Date & Time</label>
                    <div style={styles.dateCard}>
                        <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 13, marginBottom: 14 }}>Select Date</div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            <select value={dtDay} onChange={e => setDtDay(Number(e.target.value))} style={{ ...sel, flex: '0 0 80px' }}>
                                {days.map(d => <option key={d} value={d}>{String(d).padStart(2,'0')}</option>)}
                            </select>
                            <select value={dtMonth} onChange={e => setDtMonth(Number(e.target.value))} style={{ ...sel, flex: '1 1 120px' }}>
                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <select value={dtYear} onChange={e => setDtYear(Number(e.target.value))} style={{ ...sel, flex: '0 0 90px' }}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 13, marginBottom: 10 }}>Select Time</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select value={dtHour} onChange={e => setDtHour(e.target.value)} style={{ ...sel, flex: '0 0 80px' }}>
                                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 18 }}>:</span>
                            <select value={dtMin} onChange={e => setDtMin(e.target.value)} style={{ ...sel, flex: '0 0 80px' }}>
                                {MINS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                {['AM', 'PM'].map(ap => (
                                    <button type="button" key={ap} onClick={() => setDtAmPm(ap)} style={{
                                        padding: '9px 16px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                                        background: dtAmPm === ap ? '#2563eb' : '#f8fafc',
                                        color: dtAmPm === ap ? '#fff' : '#475569'
                                    }}>{ap}</button>
                                ))}
                            </div>
                        </div>

                        <div style={styles.confirmationBar}>
                            <span style={{ fontSize: 18 }}>📅</span>
                            <div>
                                <div style={{ fontWeight: 700, color: '#166534', fontSize: 13 }}>Scheduled for</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{scheduledDisplay}</div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery extras */}
                    {isDelivery && (
                        <>
                            <label style={styles.label}>📍 Receiver Address</label>
                            <input style={styles.input} placeholder="Delivery address" value={form.receiverAddress} onChange={e => setForm({ ...form, receiverAddress: e.target.value })} required />
                            <label style={styles.label}>📞 Receiver Phone</label>
                            <input style={styles.input} type="tel" placeholder="Phone number" value={form.receiverPhone} onChange={e => setForm({ ...form, receiverPhone: e.target.value })} required />
                        </>
                    )}

                    <button style={styles.primaryBtn} type="submit" disabled={submitting}>
                        {submitting ? '⏳ Posting...' : isRepost ? '🔁 Repost Task' : '🚀 Post Task'}
                    </button>
                </form>
            </div>

            {alert && (
                <AlertDialog
                    type={alert.type}
                    title={alert.title}
                    message={alert.message}
                    onClose={() => {
                        setAlert(null);
                        if (alert.redirect) navigate('/tasks', { replace: true });
                        else setSubmitting(false);
                    }}
                />
            )}
        </div>
    );
}

const styles = {
    page:   { minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '24px 16px' },
    shell:  { maxWidth: 820, margin: '0 auto' },
    backBtn: { background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', marginBottom: 16, fontSize: 14 },
    hero: { background: 'rgba(255,255,255,0.9)', border: '1px solid #dbeafe', borderRadius: 18, padding: 24, boxShadow: '0 12px 40px rgba(15,23,42,0.08)', marginBottom: 16 },
    badge: { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: 13, borderRadius: 999, padding: '6px 14px', marginBottom: 10 },
    title: { margin: '0 0 10px', color: '#0f172a', fontSize: 30, lineHeight: 1.2 },
    subtitle: { margin: 0, color: '#475569', fontSize: 15 },
    card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, boxShadow: '0 10px 24px rgba(2,6,23,0.06)' },
    input: { display: 'block', width: '100%', padding: '12px 14px', marginBottom: 14, border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', background: '#fff', outline: 'none' },
    label: { display: 'block', marginBottom: 8, color: '#0f172a', fontSize: 13, fontWeight: 700 },
    dateCard: { background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: 14, padding: '18px 16px', marginBottom: 16 },
    confirmationBar: { marginTop: 16, padding: '14px 16px', borderRadius: 12, background: '#ecfdf5', border: '1.5px solid #86efac', display: 'flex', gap: 12, alignItems: 'center' },
    lockedCategory: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 14px', marginBottom: 14, border: '2px solid #bfdbfe', borderRadius: 10, fontSize: 15, boxSizing: 'border-box', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 },
    suggestionBox: { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, border: '1px solid #cbd5e1', background: '#fff', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,23,42,0.08)', overflow: 'hidden', marginTop: 6, maxHeight: 260, overflowY: 'auto' },
    suggestionItem: { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: '#fff' },
    primaryBtn: { width: '100%', padding: '14px 16px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 700, marginTop: 8, boxShadow: '0 8px 20px rgba(37,99,235,0.3)' }
};
