import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// ── Home / Dashboard ───────────────────────────────────────────────
function Home({ user, onLogout }) {
    const [dbStatus, setDbStatus] = useState(null);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/db-test')
            .then(res => res.json())
            .then(data => setDbStatus(data))
            .catch(() => setDbStatus({ success: false }));

        fetch('/api/movies')
            .then(res => res.json())
            .then(data => {
                if (data.success) setMovies(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="App">
            <header className="hero-section">
                <div className="header-top">
                    <div className="brand">
                        <span className="brand-icon">🎭</span>
                        <div>
                            <h1 className="title">THEATRO <span className="highlight">Cinemas</span></h1>
                        </div>
                    </div>

                    <div className="header-right">
                        {dbStatus && (
                            <div className={`status-badge ${dbStatus.success ? 'success' : 'error'}`}>
                                <span className="indicator"></span>
                                DB {dbStatus.success ? 'Connected' : 'Offline'}
                            </div>
                        )}
                        <div className="user-pill">
                            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                            <div className="user-info">
                                <span className="user-name">{user.name}</span>
                                {user.phoneNo && <span className="user-phone">{user.phoneNo}</span>}
                            </div>
                            <button id="logout-btn" className="logout-btn" onClick={onLogout}>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main-content">
                <div className="section-header">
                    <h2>Now Showing</h2>
                    <p>Book your favourite film today</p>
                </div>

                {loading ? (
                    <div className="loader">
                        <div className="loader-spinner"></div>
                        <span>Loading movies…</span>
                    </div>
                ) : movies.length > 0 ? (
                    <div className="movie-grid">
                        {movies.map((movie, index) => (
                            <div key={index} className="movie-card">
                                <div className="movie-content">
                                    <h3>{movie.title || movie.Title || 'Untitled Movie'}</h3>
                                    <p>
                                        {movie.duration || 'N/A'} mins &bull;{' '}
                                        ⭐ {movie.rating || 'N/A'} &bull;{' '}
                                        {movie.language || 'Multiple Languages'}
                                    </p>
                                </div>
                                <div className="movie-footer">
                                    <span className="genre">{movie.genre || movie.Genre || 'Action'}</span>
                                    <button className="book-btn">Book Tickets</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">🎬</span>
                        <p>No movies available right now.</p>
                        <p className="sub-text">Database connected, but the Movie table is empty.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Root App ─────────────────────────────────────────────────────
function App() {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('theatro_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('theatro_user');
        setUser(null);
    };

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        user
                            ? <Home user={user} onLogout={handleLogout} />
                            : <Navigate to="/login" replace />
                    }
                />
                <Route
                    path="/login"
                    element={
                        user
                            ? <Navigate to="/" replace />
                            : <Login onLogin={handleLogin} />
                    }
                />
                <Route
                    path="/register"
                    element={
                        user
                            ? <Navigate to="/" replace />
                            : <Register onLogin={handleLogin} />
                    }
                />
                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
