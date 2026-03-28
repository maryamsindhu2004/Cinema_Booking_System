import React, { useState, useEffect } from 'react';
import '../App.css';

export default function CustomerDashboard({ user, onLogout }) {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [bookingState, setBookingState] = useState('browse'); // browse, detail, payment, success

    useEffect(() => {
        fetch('/api/movies')
            .then(res => res.json())
            .then(data => {
                if (data.success) setMovies(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const startBooking = (movie) => {
        setSelectedMovie(movie);
        setBookingState('detail');
    };

    const confirmTiming = () => {
        setBookingState('payment');
    };

    const handlePayment = (e) => {
        e.preventDefault();
        // Simulate payment and booking POST /api/booking
        fetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id || 1, showId: 1 }) // Hardcoded showId for lab setup
        }).then(() => {
            setBookingState('success');
        }).catch(err => {
            console.error(err);
            setBookingState('success'); // proceed anyway for demo
        });
    };

    return (
        <div className="App customer-portal">
            <header className="hero-section">
                <div className="header-top">
                    <div className="brand">
                        <span className="brand-icon">🎟️</span>
                        <div><h1 className="title">THEATRO <span className="highlight">Cinemas</span></h1></div>
                    </div>
                    <div className="header-right">
                        <div className="user-pill">
                            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                            <span className="user-name">{user.name}</span>
                            <button className="logout-btn" onClick={onLogout}>Sign Out</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main-content">
                {bookingState === 'browse' && (
                    <>
                        <div className="section-header">
                            <h2>Now Showing</h2>
                            <p>Book your favourite film today</p>
                        </div>

                        {loading ? <p>Loading movies...</p> : (
                            <div className="movie-grid">
                                {movies.map((movie, index) => (
                                    <div key={index} className="movie-card">
                                        <div className="movie-content">
                                            <h3>{movie.title || movie.Title}</h3>
                                            <p>{movie.duration || '120'} mins • ⭐ {movie.rating || 'N/A'}</p>
                                        </div>
                                        <div className="movie-footer">
                                            <span className="genre">{movie.genre || movie.Genre}</span>
                                            <button className="book-btn" onClick={() => startBooking(movie)}>Select Movie</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {bookingState === 'detail' && selectedMovie && (
                    <div className="booking-wizard">
                        <h2>{selectedMovie.title} - Select Show Timing</h2>
                        <div className="timing-options" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '2rem 0' }}>
                            {['7:00 PM', '9:30 PM'].map(time => (
                                <button key={time} className="timing-btn" style={{ padding: '1rem 2rem', background: '#374151', color: 'white', border: '1px solid #4b5563', borderRadius: '8px', cursor: 'pointer' }} onClick={confirmTiming}>
                                    {time}
                                </button>
                            ))}
                        </div>
                        <button className="back-btn" onClick={() => setBookingState('browse')} style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer' }}>← Back to Movies</button>
                    </div>
                )}

                {bookingState === 'payment' && (
                    <div className="payment-wizard">
                        <h2>Secure Checkout</h2>
                        <p style={{ color: '#9ca3af' }}>Booking standard ticket for {selectedMovie.title}. Total: $15.00</p>
                        
                        <form onSubmit={handlePayment} style={{ background: '#1f2937', padding: '2rem', borderRadius: '12px', maxWidth: '400px', marginTop: '2rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem' }}>Card Number</label>
                                <input type="text" placeholder="1234 5678 9101 1121" required style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #374151', color: 'white', borderRadius: '8px' }}/>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem' }}>Expiry</label>
                                    <input type="text" placeholder="MM/YY" required style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #374151', color: 'white', borderRadius: '8px' }}/>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem' }}>CVV</label>
                                    <input type="text" placeholder="123" required style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #374151', color: 'white', borderRadius: '8px' }}/>
                                </div>
                            </div>
                            <button type="submit" className="book-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Pay $15.00 & Confirm</button>
                        </form>
                        <button className="back-btn" onClick={() => setBookingState('detail')} style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', marginTop: '1rem' }}>← Cancel Payment</button>
                    </div>
                )}

                {bookingState === 'success' && (
                    <div className="success-wizard" style={{ textAlign: 'center', marginTop: '4rem' }}>
                        <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0' }}>✅</h1>
                        <h2>Payment Successful!</h2>
                        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Your tickets for {selectedMovie.title} have been booked.</p>
                        <button className="book-btn" onClick={() => setBookingState('browse')}>Book Another Movie</button>
                    </div>
                )}
            </main>
        </div>
    );
}
