import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminFeedback() {
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responseMap, setResponseMap] = useState({}); // feedbackId -> responseText
    const [filter, setFilter] = useState('all'); // all, pending, responded

    const user = JSON.parse(localStorage.getItem('theatro_user'));

    useEffect(() => {
        if (!user || !user.isAdmin) {
            navigate('/');
            return;
        }
        fetchFeedback();
    }, []);

    const fetchFeedback = () => {
        setLoading(true);
        fetch('/api/admin/feedback')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setFeedbacks(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setLoading(false);
            });
    };

    const handleResponseChange = (id, text) => {
        setResponseMap({ ...responseMap, [id]: text });
    };

    const submitResponse = async (feedbackId) => {
        const responseText = responseMap[feedbackId];
        if (!responseText || responseText.trim() === '') return;

        try {
            const res = await fetch(`/api/admin/feedback/${feedbackId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response: responseText })
            });
            const data = await res.json();
            if (data.success) {
                alert('Response sent!');
                fetchFeedback(); // Refresh
                setResponseMap({ ...responseMap, [feedbackId]: '' });
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Failed to submit response.');
        }
    };

    const filteredFeedback = feedbacks.filter(f => {
        if (filter === 'pending') return !f.adminResponse;
        if (filter === 'responded') return !!f.adminResponse;
        return true;
    });

    return (
        <div className="main-content" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, color: 'var(--container-accent)' }}>Feedback Dashboard</h1>
                    <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Manage and respond to user experiences</p>
                </div>
                <button className="logout-btn" onClick={() => navigate('/')}>&larr; Back to Home</button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {['all', 'pending', 'responded'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '30px',
                            border: 'none',
                            background: filter === type ? 'var(--container-accent)' : 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontWeight: '600',
                            transition: '0.3s'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loader">
                    <div className="loader-spinner"></div>
                </div>
            ) : filteredFeedback.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {filteredFeedback.map(f => (
                        <div key={f.feedbackId} style={{
                            background: 'var(--container-bg)',
                            borderRadius: '15px',
                            padding: '1.5rem',
                            border: '1px solid var(--container-border)',
                            boxShadow: 'var(--shadow)',
                            color: 'var(--container-text)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'var(--container-accent)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                    }}>
                                        {f.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{f.userName}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{f.userEmail}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', color: '#fbbf24' }}>
                                        {'⭐'.repeat(f.rating)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                        {new Date(f.submitted_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '1rem' }}>
                                <p style={{ margin: 0, fontStyle: 'italic' }}>"{f.comments}"</p>
                            </div>

                            {f.adminResponse ? (
                                <div style={{ 
                                    padding: '1rem', 
                                    background: 'rgba(16, 185, 129, 0.1)', 
                                    borderLeft: '4px solid #10b981', 
                                    borderRadius: '4px' 
                                }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#10b981', marginBottom: '0.5rem' }}>Admin Response</div>
                                    <p style={{ margin: 0 }}>{f.adminResponse}</p>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>
                                        Responded on {new Date(f.respondedAt).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: '1rem' }}>
                                    <textarea
                                        placeholder="Write a response..."
                                        value={responseMap[f.feedbackId] || ''}
                                        onChange={(e) => handleResponseChange(f.feedbackId, e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            background: 'var(--input-bg)',
                                            border: '1px solid var(--container-border)',
                                            borderRadius: '8px',
                                            color: 'var(--container-text)',
                                            minHeight: '80px',
                                            resize: 'vertical',
                                            marginBottom: '0.5rem'
                                        }}
                                    />
                                    <button
                                        onClick={() => submitResponse(f.feedbackId)}
                                        style={{
                                            padding: '0.5rem 1.5rem',
                                            background: 'var(--container-accent)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Submit Response
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>💬</span>
                    <p>No feedback found in this category.</p>
                </div>
            )}
        </div>
    );
}

export default AdminFeedback;
