import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function MovieDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [weekendOnly, setWeekendOnly] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/movies/${id}/shows?weekendOnly=${weekendOnly}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setShows(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id, weekendOnly]);

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        if (typeof timeStr === 'string' && timeStr.includes('T')) {
            return timeStr.split('T')[1].substring(0, 5);
        }
        return timeStr.substring(0, 5);
    };

    const groupedShows = shows.reduce((acc, show) => {
        const cinema = show.cinemaName;
        const date = new Date(show.showDate).toLocaleDateString(undefined, { 
            weekday: 'short', month: 'short', day: 'numeric' 
        });
        
        if (!acc[cinema]) acc[cinema] = {};
        if (!acc[cinema][date]) acc[cinema][date] = {};
        if (!acc[cinema][date][show.screenType]) acc[cinema][date][show.screenType] = {
            price: show.priceScreen,
            desc: show.screenDesc,
            hasWheelchair: show.wheelchairCount > 0,
            times: []
        };
        
        acc[cinema][date][show.screenType].times.push(show);
        return acc;
    }, {});

    return (
        <div className="main-content" style={{padding: '1rem'}}>
            <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center'}}>
                <button className="logout-btn" onClick={() => navigate('/')} style={{padding: '0.5rem 1rem', fontSize: '0.9rem', margin: 0}}>
                    &larr; Back
                </button>
                <button 
                    onClick={() => setWeekendOnly(!weekendOnly)}
                    style={{
                        padding: '0.5rem 1.2rem', borderRadius: '30px', border: 'none',
                        background: weekendOnly ? '#FF3366' : '#334155', color: '#fff',
                        cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', transition: '0.3s'
                    }}
                >
                    {weekendOnly ? '🎉 Weekend Selected (Fri-Sun)' : '📅 All Days'}
                </button>
            </div>

            {loading ? (
                <div className="loader">
                    <div className="loader-spinner"></div>
                </div>
            ) : Object.keys(groupedShows).length > 0 ? (
                Object.entries(groupedShows).map(([cinemaName, dates]) => (
                    <div key={cinemaName} style={{marginBottom: '2rem'}}>
                        <h2 style={{color: '#FF3366', fontSize: '1.8rem', marginBottom: '0.2rem'}}>{cinemaName}</h2>
                        <p style={{color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem'}}>📍 {shows.find(s => s.cinemaName === cinemaName)?.location}</p>

                        {Object.entries(dates).map(([dateStr, screens]) => (
                            <div key={dateStr} style={{
                                background: 'var(--container-bg)',
                                borderRadius: '12px',
                                border: '1px solid var(--container-border)',
                                overflow: 'hidden',
                                marginBottom: '1rem',
                                boxShadow: 'var(--shadow)'
                            }}>
                                <div style={{
                                    background: 'rgba(0,0,0,0.05)',
                                    padding: '0.75rem',
                                    textAlign: 'left',
                                    paddingLeft: '1.5rem',
                                    borderBottom: '1px solid var(--container-border)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    color: 'var(--container-text)'
                                }}>
                                    {dateStr}
                                </div>

                                <div style={{display: 'flex'}}>
                                    {Object.entries(screens).map(([screenType, screenData], idx) => (
                                        <div key={screenType} style={{
                                            flex: 1,
                                            borderRight: idx < Object.keys(screens).length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            <div style={{
                                                padding: '0.75rem',
                                                background: 'rgba(0,0,0,0.02)',
                                                textAlign: 'center',
                                                borderBottom: '1px solid rgba(0,0,0,0.05)'
                                            }}>
                                                <h3 style={{
                                                    margin: 0, 
                                                    fontSize: '1rem', 
                                                    textTransform: 'uppercase', 
                                                    letterSpacing: '2px',
                                                    color: 'var(--container-text)'
                                                }}>
                                                    {screenType} SCREEN
                                                </h3>
                                                <div style={{
                                                    display: 'flex', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    gap: '1rem',
                                                    marginTop: '0.2rem'
                                                }}>
                                                    {screenData.hasWheelchair && <span title="Wheelchair Accessible" style={{fontSize: '0.9rem', color: 'var(--container-text)'}}>♿</span>}
                                                    <span style={{fontSize: '0.85rem', color: 'var(--container-accent)', fontWeight: '700'}}>Rs. {screenData.price}</span>
                                                </div>
                                            </div>

                                            <div style={{padding: '1rem', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem'}}>
                                                {screenData.times.map(show => (
                                                    <button 
                                                        key={show.showId} 
                                                        onClick={() => navigate(`/book/${show.showId}`)}
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            color: 'var(--container-text)',
                                                            padding: '0.4rem',
                                                            borderRadius: '6px',
                                                            background: 'rgba(255,255,255,0.15)',
                                                            border: '1px solid var(--container-border)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            fontWeight: '600'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.background = 'var(--container-accent)'}
                                                        onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                                                    >
                                                        {formatTime(show.startTime)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            ) : (
                <div className="empty-state">
                    <p>No shows scheduled.</p>
                </div>
            )}
        </div>
    );
}

export default MovieDetails;
