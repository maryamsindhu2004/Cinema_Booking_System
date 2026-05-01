import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function MovieDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/movies/${id}/shows`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setShows(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        
        // If it's an ISO string like "1970-01-01T11:00:00.000Z"
        if (typeof timeStr === 'string' && timeStr.includes('T')) {
            const timePart = timeStr.split('T')[1]; // Get "11:00:00.000Z"
            return timePart.substring(0, 5); // Get "11:00"
        }
        
        // If it's already a clean HH:mm string
        if (typeof timeStr === 'string' && timeStr.includes(':')) {
            return timeStr.substring(0, 5); 
        }

        // Fallback for Date objects
        const d = new Date(timeStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="main-content">
            <button className="logout-btn" onClick={() => navigate('/')} style={{marginBottom: '2rem'}}>
                &larr; Back to Movies
            </button>

            <div className="section-header">
                <h2>Available Showtimes</h2>
                <p>Select a cinema and time to book seats</p>
            </div>

            {loading ? (
                <div className="loader">
                    <div className="loader-spinner"></div>
                    <span>Finding showtimes…</span>
                </div>
            ) : shows.length > 0 ? (
                <div className="movie-grid">
                    {shows.map((show) => (
                        <div key={show.showId} className="movie-card">
                            <div className="movie-content">
                                <h3 style={{color: '#FF3366'}}>{show.cinemaName}</h3>
                                <p style={{marginBottom: '0.5rem'}}>{show.location}</p>
                                <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
                                    <span className="genre">{show.screenType}</span>
                                    <span className="genre" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
                                        {new Date(show.showDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{fontSize: '1.2rem', fontWeight: '700', margin: 0}}>
                                    🕒 {formatTime(show.startTime)} - {formatTime(show.endTime)}
                                </p>
                            </div>
                            <div className="movie-footer">
                                <button className="book-btn" onClick={() => navigate(`/book/${show.showId}`)} style={{width: '100%'}}>
                                    Select Seats
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <p>No shows scheduled for this movie.</p>
                    <p className="sub-text">Please check back later or select another movie.</p>
                </div>
            )}
        </div>
    );
}

export default MovieDetails;
