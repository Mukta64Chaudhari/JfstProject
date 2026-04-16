import { useEffect, useState } from 'react';
import { getMyTasks, getWorkerBookings, getTaskBooking, completeBooking, createReview, getWorkerReviews } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RatingModal from '../components/RatingModal';

function formatDateTime(value) {
    if (!value) return 'Not specified';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Not specified';
    return dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MyTasks() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [showRating, setShowRating] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [taskRatings, setTaskRatings] = useState({});
    const [customerTaskReviews, setCustomerTaskReviews] = useState({});
    const [justReviewedTaskIds, setJustReviewedTaskIds] = useState({});
    const [customerBookings, setCustomerBookings] = useState({});

    useEffect(() => {
        if (user?.role === 'CUSTOMER') {
            getMyTasks(user.userId).then(({ data }) => setItems(data));
        } else {
            getWorkerBookings(user.userId).then(({ data }) => setItems(data));
        }
    }, [user?.role, user?.userId]);

    useEffect(() => {
        if (user?.role !== 'WORKER' || items.length === 0) {
            return;
        }

        getWorkerReviews(user.userId).then(({ data }) => {
            const map = {};
            items.forEach((booking) => {
                const taskId = booking.task?.id;
                if (!taskId) return;

                const taskSpecific = data
                    .filter(r => Number(r?.task?.id) === Number(taskId))
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

                // Backward compatibility for older reviews that were saved without task link.
                const legacyFallback = data
                    .filter(r => !r?.task && Number(r?.customer?.id) === Number(booking.task?.postedBy?.id))
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

                const match = taskSpecific || legacyFallback;
                if (match) {
                    map[taskId] = match;
                }
            });
            setTaskRatings(map);
        }).catch(() => {
            setTaskRatings({});
        });
    }, [items, user?.role, user?.userId]);

    useEffect(() => {
        if (user?.role !== 'CUSTOMER') {
            setCustomerBookings({});
            setCustomerTaskReviews({});
            setJustReviewedTaskIds({});
            return;
        }

        const completedTasks = items.filter(task => task?.status === 'COMPLETED' && task?.assignedTo?.id);
        if (completedTasks.length === 0) {
            return;
        }

        const workerIds = [...new Set(completedTasks.map(task => task.assignedTo?.id).filter(Boolean))];
        Promise.all(workerIds.map(workerId => getWorkerReviews(workerId).then(({ data }) => ({ workerId, data })).catch(() => ({ workerId, data: [] }))))
            .then((allReviews) => {
                const map = {};
                completedTasks.forEach((task) => {
                    const workerReviewSet = allReviews.find(r => r.workerId === task.assignedTo?.id)?.data || [];
                    const match = workerReviewSet
                        .filter(r => r?.task?.id === task.id && r?.customer?.id === user.userId)
                        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                    if (match) {
                        map[task.id] = match;
                    }
                });
                setCustomerTaskReviews(prev => ({ ...prev, ...map }));
            });
    }, [items, user?.role]);

    useEffect(() => {
        if (user?.role !== 'CUSTOMER' || items.length === 0) {
            if (user?.role !== 'CUSTOMER') {
                setCustomerBookings({});
            }
            return;
        }

        Promise.all(
            items.map((task) =>
                getTaskBooking(task.id)
                    .then(({ data }) => ({ taskId: task.id, booking: data }))
                    .catch(() => ({ taskId: task.id, booking: null }))
            )
        ).then((results) => {
            const map = {};
            results.forEach(({ taskId, booking }) => {
                if (booking) {
                    map[taskId] = booking;
                }
            });
            setCustomerBookings(map);
        });
    }, [items, user?.role]);

    const handleComplete = async (id) => {
        await completeBooking(id);
        getWorkerBookings(user.userId).then(({ data }) => setItems(data));
    };

    const handleRate = async (reviewData) => {
        try {
            await createReview({
                worker: { id: reviewData.workerId },
                customer: { id: user.userId },
                task: { id: selectedBooking.task?.id },
                rating: reviewData.rating,
                comment: reviewData.comment
            });
            setShowRating(false);
            if (selectedBooking?.task?.id) {
                const reviewedTaskId = selectedBooking.task.id;
                setJustReviewedTaskIds(prev => ({ ...prev, [reviewedTaskId]: true }));
                setCustomerTaskReviews(prev => ({
                    ...prev,
                    [reviewedTaskId]: {
                        rating: reviewData.rating,
                        comment: reviewData.comment
                    }
                }));
            }
            if (user?.role === 'CUSTOMER') {
                getMyTasks(user.userId).then(({ data }) => setItems(data));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <span style={styles.badge}>My Tasks</span>
                    <h2 style={styles.title}>{user?.role === 'CUSTOMER' ? 'My Posted Tasks' : 'My Bookings'}</h2>
                    <p style={styles.subtitle}>A focused view of the tasks and bookings related to your account.</p>
                </div>
            </div>

            <div style={styles.list}>
                {items.length === 0 && <p style={{ color: '#94a3b8' }}>Nothing here yet.</p>}
                {items.map(item => {
                    const task = user?.role === 'CUSTOMER' ? item : item.task;
                    const booking = user?.role === 'CUSTOMER' ? customerBookings[item.id] : item;
                    return (
                        <div key={item.id} style={styles.card}>
                            <div style={styles.row}>
                                <div>
                                    <h4 style={{ margin: 0, color: '#0f172a' }}>{task?.title}</h4>
                                    <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 14 }}>{task?.description}</p>
                                    
                                    {/* Requested By - Customer */}
                                    {task?.postedBy && (
                                        <p style={{ color: '#334155', margin: '8px 0 0', fontSize: 13, fontWeight: 600 }}>
                                            Requested by: {user?.role === 'CUSTOMER' ? 'You' : task.postedBy.name}
                                            {user?.role === 'WORKER' && task.postedBy.phone ? ` (${task.postedBy.phone})` : ''}
                                        </p>
                                    )}
                                    
                                    {/* Requested At */}
                                    {task?.createdAt && (
                                        <p style={{ color: '#475569', margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>
                                            Requested At: {formatDateTime(task.createdAt)}
                                        </p>
                                    )}
                                    
                                    {/* Service Scheduled For */}
                                    <p style={{ color: '#475569', margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>
                                        Service Scheduled: {formatDateTime(task?.scheduledAt)}
                                    </p>
                                    
                                    {/* Completed At */}
                                    {user?.role === 'CUSTOMER' && booking?.completedAt && (
                                        <p style={{ color: '#10b981', margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>
                                            ✓ Completed: {formatDateTime(booking.completedAt)}
                                        </p>
                                    )}
                                    {user?.role === 'WORKER' && booking?.completedAt && (
                                        <p style={{ color: '#10b981', margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>
                                            ✓ Completed: {formatDateTime(booking.completedAt)}
                                        </p>
                                    )}
                                    
                                    {user?.role === 'CUSTOMER' && task?.assignedTo && (
                                        <p style={{ color: '#334155', margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>
                                            Accepted by: {task.assignedTo.name}
                                            {task.assignedTo.phone ? ` (${task.assignedTo.phone})` : ''}
                                        </p>
                                    )}
                                </div>
                                <span style={{ ...styles.status, background: item.status === 'OPEN' || item.status === 'ACCEPTED' ? '#dcfce7' : '#f1f5f9', color: item.status === 'OPEN' || item.status === 'ACCEPTED' ? '#16a34a' : '#64748b' }}>
                                    {item.status}
                                </span>
                            </div>

                            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {user?.role === 'WORKER' && item.status === 'ACCEPTED' && (
                                    <button onClick={() => handleComplete(item.id)} style={styles.actionBtn}>
                                        Mark as Complete
                                    </button>
                                )}
                                {user?.role === 'WORKER' && taskRatings[task?.id] && (
                                    <div style={styles.ratingTag}>
                                        Customer Rated: ⭐ {taskRatings[task?.id].rating}/5
                                        {taskRatings[task?.id].comment ? ` - ${taskRatings[task?.id].comment}` : ''}
                                    </div>
                                )}
                                {user?.role === 'CUSTOMER' && item.status === 'COMPLETED' && customerTaskReviews[task?.id] && (
                                    <div style={styles.ratingTag}>
                                        You Rated: ⭐ {customerTaskReviews[task?.id].rating}/5
                                        {customerTaskReviews[task?.id].comment ? ` - ${customerTaskReviews[task?.id].comment}` : ''}
                                    </div>
                                )}
                                {user?.role === 'CUSTOMER' && item.status === 'COMPLETED' && !customerTaskReviews[task?.id] && justReviewedTaskIds[task?.id] && (
                                    <div style={styles.ratingTag}>Review submitted successfully.</div>
                                )}
                                {user?.role === 'CUSTOMER' && item.status === 'COMPLETED' && !customerTaskReviews[task?.id] && !justReviewedTaskIds[task?.id] && (
                                    <button onClick={() => {
                                        setSelectedBooking({ task, workerId: item.assignedTo?.id });
                                        setShowRating(true);
                                    }} style={styles.reviewBtn}>
                                        Leave a Review
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showRating && selectedBooking && (
                <RatingModal
                    booking={selectedBooking}
                    worker={{ id: selectedBooking.workerId, name: selectedBooking.task?.assignedTo?.name || 'Worker' }}
                    onRate={handleRate}
                    onClose={() => setShowRating(false)}
                />
            )}
        </div>
    );
}

const styles = {
    page: { maxWidth: 960, margin: '0 auto', padding: '24px 16px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, flexWrap: 'wrap' },
    badge: { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: 12, borderRadius: 999, padding: '6px 12px', marginBottom: 8 },
    title: { margin: '0 0 6px', color: '#0f172a', fontSize: 30 },
    subtitle: { margin: 0, color: '#64748b', fontSize: 14 },
    list: { display: 'grid', gap: 14 },
    card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 8px 20px rgba(2,6,23,0.05)' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
    status: { padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, height: 'fit-content' },
    actionBtn: { padding: '8px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
    reviewBtn: { padding: '8px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
    ratingTag: { padding: '8px 12px', borderRadius: 10, background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', fontSize: 12, fontWeight: 700 }
};
