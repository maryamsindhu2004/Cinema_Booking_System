import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // 1. Safe User Fetching
    const getUser = () => {
        try {
            const saved = localStorage.getItem('theatro_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    };

    const user = getUser();

    // 2. Fetch Data
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const uid = user.userId || user.id;
        console.log("📡 [MyBookings] Fetching for UID:", uid);

        fetch(`/api/bookings/user/${uid}`)
            .then(res => {
                if (!res.ok) throw new Error("Server response was not OK");
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    setBookings(Array.isArray(data.data) ? data.data : []);
                } else {
                    setError(data.error || "Failed to load bookings");
                }
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // 3. Handle Cancel
    const handleCancel = async (id) => {
        if (!window.confirm("Cancel?")) return;
        try {
            const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                window.location.reload();
            }
        } catch (e) {
            alert("Error cancelling");
        }
    };

    // 4. Render Logic
    if (!user) return <div style={{color: 'white', padding: '2rem'}}>Redirecting to login...</div>;

    return (
        <div className="main-content" style={{color: '#fff', minHeight: '100vh'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
                <h1 style={{margin: 0}}>History</h1>
                <button className="logout-btn" onClick={() => navigate('/')}>Back</button>
            </div>

            {error && (
                <div style={{background: '#450a0a', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', color: '#fca5a5'}}>
                    <b>Error:</b> {error}
                </div>
            )}

            {loading ? (
                <div style={{padding: '4rem', textAlign: 'center'}}>Loading...</div>
            ) : bookings.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {bookings.map(b => (
                        <div key={b.bookingId} style={{background: '#1e293b', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between'}}>
                            <div>
                                <h3 style={{margin: '0 0 0.5rem 0'}}>{b.movieTitle}</h3>
                                <p style={{margin: 0, color: '#94a3b8', fontSize: '0.9rem'}}>
                                    {b.showDate ? new Date(b.showDate).toLocaleDateString() : ''} @ {b.startTime}
                                </p>
                                <p style={{marginTop: '0.5rem', color: '#fb7185', margin: 0}}>Seats: {b.seats || 'Cancelled'}</p>
                                {b.snacks && (
                                    <p style={{marginTop: '0.5rem', color: '#fbbf24', margin: 0, fontSize: '0.85rem'}}>🍿 Snacks: <b>{b.snacks}</b></p>
                                )}
                            </div>
                            <div style={{textAlign: 'right'}}>
                                <div style={{fontSize: '1.2rem', color: '#10b981', fontWeight: 'bold'}}>Rs. {b.totalAmount || 0}</div>
                                <div style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px'}}>
                                    💳 {b.paymentMethod || 'Cash'}
                                </div>
                                {b.seats && (
                                    <button onClick={() => handleCancel(b.bookingId)} style={{background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px'}}>Cancel</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{padding: '4rem', textAlign: 'center', color: '#94a3b8'}}>No bookings yet.</div>
            )}
        </div>
    );
}

export default MyBookings;
