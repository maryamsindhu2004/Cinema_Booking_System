import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Feedback = () => {
    const navigate = useNavigate();
    const [rating, setRating] = useState(5);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const user = JSON.parse(localStorage.getItem('theatro_user'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId || user.id,
                    rating,
                    comments
                })
            });
            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
                setTimeout(() => navigate('/'), 3000);
            }
        } catch (err) {
            console.error('Feedback failed', err);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="layout-container" style={{justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
                <div style={{background: 'var(--container-bg)', padding: '3rem', borderRadius: '20px', textAlign: 'center', boxShadow: 'var(--shadow)', maxWidth: '500px'}}>
                    <h1 style={{fontSize: '4rem', margin: 0}}>🌟</h1>
                    <h2 style={{color: 'var(--container-text)'}}>Thank You for your Feedback!</h2>
                    <p style={{color: 'var(--container-text)', opacity: 0.8}}>Your experience helps us make THEATRO better. Redirecting you home...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="layout-container" style={{justifyContent: 'center', alignItems: 'center', padding: '2rem'}}>
            <div style={{
                background: 'var(--container-bg)', 
                padding: '3rem', 
                borderRadius: '20px', 
                boxShadow: 'var(--shadow)', 
                width: '100%', 
                maxWidth: '600px',
                color: 'var(--container-text)'
            }}>
                <h2 style={{marginTop: 0, borderBottom: '1px solid var(--container-border)', paddingBottom: '1rem'}}>Share Your Experience</h2>
                <p style={{opacity: 0.8, marginBottom: '2rem'}}>How was your booking experience with THEATRO?</p>

                <form onSubmit={handleSubmit}>
                    <div style={{marginBottom: '2rem'}}>
                        <label style={{display: 'block', marginBottom: '1rem', fontWeight: '700'}}>Rating</label>
                        <div style={{display: 'flex', gap: '1rem', fontSize: '2rem', justifyContent: 'center'}}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span 
                                    key={star}
                                    onClick={() => setRating(star)}
                                    style={{
                                        cursor: 'pointer',
                                        color: star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{marginBottom: '2rem'}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '700'}}>Your Comments</label>
                        <textarea 
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Tell us what you liked or how we can improve..."
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--container-border)',
                                color: 'var(--text-main)',
                                fontSize: '1rem',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{display: 'flex', gap: '1rem'}}>
                        <button 
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'var(--container-accent)',
                                color: 'white',
                                border: 'none',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            {loading ? 'Sending...' : 'Submit Feedback'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => navigate('/')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.1)',
                                color: 'var(--container-text)',
                                border: '1px solid var(--container-border)',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Feedback;
