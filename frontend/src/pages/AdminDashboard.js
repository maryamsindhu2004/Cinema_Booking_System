import React, { useState, useEffect } from 'react';
import '../App.css';

export default function AdminDashboard({ user, onLogout }) {
    const [movies, setMovies] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMovie, setNewMovie] = useState({ title: '', genre: '', duration: '', rating: '', language: '', releaseDate: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const mRes = await fetch('/api/movies');
            const mData = await mRes.json();
            if (mData.success) setMovies(mData.data);

            const bRes = await fetch('/api/bookings');
            const bData = await bRes.json();
            if (bData.success) setBookings(bData.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleAddMovie = (e) => {
        e.preventDefault();
        alert("Movie Addition API not fully wired yet, but the UI is ready! Setup would be POST /api/movies");
    };

    const handleAddShows = () => {
        alert("Show Schedule API not fully wired yet, but it would map to POST /api/shows");
    };

    return (
        <div className="App admin-portal">
            <header className="hero-section" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
                <div className="header-top">
                    <div className="brand">
                        <span className="brand-icon">👑</span>
                        <div>
                            <h1 className="title">THEATRO <span className="highlight">Owner Portal</span></h1>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="user-pill" style={{ background: '#374151', color: 'white' }}>
                            <span className="user-avatar" style={{ background: '#ef4444' }}>O</span>
                            <span className="user-name">{user.name} (Admin)</span>
                            <button className="logout-btn" onClick={onLogout}>Exit Portal</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left Column: Management */}
                <div className="admin-section">
                    <h2>🎬 Add New Movie</h2>
                    <form className="admin-form" onSubmit={handleAddMovie}>
                        <input type="text" placeholder="Movie Title" required value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input type="text" placeholder="Genre" required value={newMovie.genre} onChange={e => setNewMovie({...newMovie, genre: e.target.value})} />
                            <input type="number" placeholder="Duration (mins)" required value={newMovie.duration} onChange={e => setNewMovie({...newMovie, duration: e.target.value})} />
                        </div>
                        <input type="text" placeholder="Language" required value={newMovie.language} onChange={e => setNewMovie({...newMovie, language: e.target.value})} />
                        <button type="submit" className="book-btn" style={{ background: '#10b981' }}>+ Publish Movie</button>
                    </form>

                    <h2 style={{ marginTop: '2rem' }}>⏰ Manage Timings</h2>
                    <div className="admin-panel">
                        <p style={{ color: '#9ca3af' }}>Select a movie to schedule its show timings.</p>
                        <select className="admin-input" style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#374151', color: 'white', border: 'none', borderRadius: '8px' }}>
                            {movies.map(m => <option key={m.movieId}>{m.title}</option>)}
                        </select>
                        <input type="datetime-local" className="admin-input" style={{ width: '95%', padding: '0.8rem', marginBottom: '1rem', background: '#374151', color: 'white', border: 'none', borderRadius: '8px' }} />
                        <button className="book-btn" onClick={handleAddShows}>Add Show Timing</button>
                    </div>
                </div>

                {/* Right Column: Analytics & Payments */}
                <div className="admin-section">
                    <h2>💰 Recent Payments & Bookings</h2>
                    {loading ? <p>Loading data...</p> : (
                        <div className="table-container" style={{ background: '#1f2937', borderRadius: '12px', padding: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', color: 'white', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #374151' }}>
                                        <th style={{ padding: '0.5rem' }}>Customer</th>
                                        <th style={{ padding: '0.5rem' }}>Booking ID</th>
                                        <th style={{ padding: '0.5rem' }}>Show Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #374151' }}>
                                            <td style={{ padding: '0.5rem' }}>{b.name}</td>
                                            <td style={{ padding: '0.5rem' }}>#{b.bookingId}</td>
                                            <td style={{ padding: '0.5rem' }}>{new Date(b.showDate).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && <tr><td colSpan="3">No bookings found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
