import { useState } from 'react';

export default function RatingModal({ booking, worker, onRate, onClose }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        setSubmitting(true);
        try {
            await onRate({ rating, comment, workerId: worker.id });
            alert('Review submitted!');
            onClose();
        } catch (err) {
            alert('Failed to submit review');
        }
        setSubmitting(false);
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>Rate {worker.name}</h3>
                
                <div style={{ marginBottom: 16 }}>
                    <p style={{ color: '#64748b', fontSize: 14 }}>How was the experience?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(r => (
                            <button
                                key={r}
                                onClick={() => setRating(r)}
                                style={{
                                    fontSize: 32,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    opacity: rating >= r ? 1 : 0.3
                                }}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>
                </div>

                <textarea
                    style={{ ...styles.input, height: 80 }}
                    placeholder="Add a comment (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onClose} style={{ flex: 1, ...styles.btnSecondary }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, ...styles.btnPrimary }}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        maxWidth: 400,
        width: '90%'
    },
    input: {
        display: 'block',
        width: '100%',
        padding: '10px 14px',
        marginBottom: 12,
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        fontSize: 14,
        boxSizing: 'border-box'
    },
    btnPrimary: {
        padding: '10px 16px',
        background: '#4f46e5',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500
    },
    btnSecondary: {
        padding: '10px 16px',
        background: '#e2e8f0',
        color: '#64748b',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 14
    }
};
