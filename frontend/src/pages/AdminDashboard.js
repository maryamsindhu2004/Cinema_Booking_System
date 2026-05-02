import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const navigate = useNavigate();
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const user = JSON.parse(localStorage.getItem('theatro_user'));

    useEffect(() => {
        if (!user || !user.isAdmin) {
            navigate('/');
            return;
        }
        fetchRevenue();
    }, []);

    const fetchRevenue = () => {
        setLoading(true);
        setError(null);
        fetch('/api/admin/revenue')
            .then(res => {
                if (!res.ok) throw new Error(`Server responded with ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    setRevenueData(data.data);
                } else {
                    setError(data.error || 'Failed to load data');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Revenue fetch error:', err);
                setError(err.message);
                setLoading(false);
            });
    };


    const currentMonth = revenueData[0] || { totalRevenue: 0, totalBookings: 0, foodRevenue: 0, ticketRevenue: 0 };

    return (
        <div className="main-content" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ margin: 0, color: 'var(--container-accent)' }}>Executive Dashboard</h1>
                    <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Financial analytics and business oversight</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="book-btn" onClick={() => navigate('/admin/feedback')} style={{ padding: '0.6rem 1.2rem', margin: 0 }}>Review Feedback</button>
                    <button className="logout-btn" onClick={() => navigate('/')} style={{ margin: 0 }}>Home</button>
                </div>
            </div>

            {loading ? (
                <div className="loader">
                    <div className="loader-spinner"></div>
                </div>
            ) : error ? (
                <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(255,0,0,0.2)', marginBottom: '2rem' }}>
                    <strong>⚠️ Error:</strong> {error}
                    <button onClick={fetchRevenue} style={{ marginLeft: '1rem', background: 'none', border: '1px solid #ff4444', color: '#ff4444', padding: '0.2rem 0.5rem', borderRadius: '5px', cursor: 'pointer' }}>Retry</button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div className="revenue-card" style={cardStyle}>
                            <span style={labelStyle}>Total Revenue ({currentMonth.month})</span>
                            <h2 style={valueStyle}>Rs. {currentMonth.totalRevenue.toLocaleString()}</h2>
                        </div>
                        <div className="revenue-card" style={cardStyle}>
                            <span style={labelStyle}>Active Bookings</span>
                            <h2 style={valueStyle}>{currentMonth.totalBookings}</h2>
                        </div>
                        <div className="revenue-card" style={cardStyle}>
                            <span style={labelStyle}>Food Concessions</span>
                            <h2 style={valueStyle}>Rs. {currentMonth.foodRevenue.toLocaleString()}</h2>
                        </div>
                        <div className="revenue-card" style={cardStyle}>
                            <span style={labelStyle}>Ticket Sales</span>
                            <h2 style={valueStyle}>Rs. {currentMonth.ticketRevenue.toLocaleString()}</h2>
                        </div>
                    </div>

                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--container-text)' }}>Monthly Performance</h2>
                    <div style={{ 
                        background: 'var(--container-bg)', 
                        borderRadius: '15px', 
                        overflow: 'hidden',
                        border: '1px solid var(--container-border)',
                        boxShadow: 'var(--shadow)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--container-text)' }}>
                            <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <tr>
                                    <th style={thStyle}>Month</th>
                                    <th style={thStyle}>Bookings</th>
                                    <th style={thStyle}>Tickets (Rs)</th>
                                    <th style={thStyle}>Food (Rs)</th>
                                    <th style={thStyle}>Total Revenue (Rs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenueData.map((row, idx) => (
                                    <tr key={row.month} style={{ borderBottom: idx < revenueData.length - 1 ? '1px solid var(--container-border)' : 'none' }}>
                                        <td style={tdStyle}>{row.month}</td>
                                        <td style={tdStyle}>{row.totalBookings}</td>
                                        <td style={tdStyle}>{row.ticketRevenue.toLocaleString()}</td>
                                        <td style={tdStyle}>{row.foodRevenue.toLocaleString()}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--container-accent)' }}>{row.totalRevenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {revenueData.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>No financial records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

const cardStyle = {
    background: 'var(--container-bg)',
    padding: '1.5rem',
    borderRadius: '15px',
    border: '1px solid var(--container-border)',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
};

const labelStyle = {
    fontSize: '0.85rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600'
};

const valueStyle = {
    margin: 0,
    fontSize: '1.8rem',
    color: 'var(--container-text)'
};

const thStyle = {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.9rem',
    color: 'var(--container-accent)'
};

const tdStyle = {
    padding: '1rem',
    fontSize: '1rem'
};

export default AdminDashboard;
