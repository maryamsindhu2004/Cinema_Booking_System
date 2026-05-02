import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import MyBookings from './pages/MyBookings';
import Feedback from './pages/Feedback';
import AdminFeedback from './pages/AdminFeedback';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

// ── Home / Dashboard ───────────────────────────────────────────────
function Home({ user, onLogout, isDark, onToggleTheme }) {
    const navigate = useNavigate();
    const [dbStatus, setDbStatus] = useState(null);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedLang, setSelectedLang] = useState('');
    const [search, setSearch] = useState('');
    const [showingOnly, setShowingOnly] = useState(false);

    useEffect(() => {
        fetch('/api/db-test')
            .then(res => res.json())
            .then(data => setDbStatus(data))
            .catch(() => setDbStatus({ success: false }));
    }, []);

    useEffect(() => {
        setLoading(true);
        const query = new URLSearchParams();
        if (selectedGenre) query.append('genre', selectedGenre);
        if (selectedLang) query.append('language', selectedLang);
        if (search) query.append('search', search);
        if (showingOnly) query.append('showingOnly', 'true');

        fetch(`/api/movies?${query.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setMovies(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedGenre, selectedLang, search, showingOnly]);

    const genres = ['Action', 'Drama', 'Comedy', 'Romance', 'Sci-Fi', 'Crime', 'Thriller', 'Horror'];
    const languages = ['English', 'Hindi', 'Urdu'];

    return (
        <div className="App">
            <header className="hero-section">
                <div className="header-top">
                    <div className="brand">
                        <span className="brand-icon">🎞️</span>
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
                            <button
                                className="theme-toggle"
                                onClick={() => onToggleTheme()}
                                style={{ marginRight: '0.5rem' }}
                                title="Toggle Theme"
                            >
                                {isDark ? '☀️' : '🌙'}
                            </button>
                            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                            <div className="user-info">
                                <span className="user-name">{user.name} {user.isAdmin ? <span style={{fontSize: '0.7rem', color: 'var(--container-accent)'}}>(Admin)</span> : ''}</span>
                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    {user.phoneNo && <span className="user-phone">{user.phoneNo}</span>}
                                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>✨ {user.loyaltyPoints || 0} pts</span>
                                </div>
                            </div>
                            {!(user.isAdmin === true || user.isAdmin === 1 || user.isAdmin === 'true' || user.isAdmin === '1') ? (
                                <button
                                    className="logout-btn"
                                    onClick={() => navigate('/feedback')}
                                    style={{ marginRight: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                                >
                                    Give Feedback
                                </button>
                            ) : (
                                <button
                                    className="logout-btn"
                                    onClick={() => navigate('/admin/dashboard')}
                                    style={{ marginRight: '0.5rem', background: '#FF3366', color: '#fff', border: '1px solid #FF3366', fontWeight: 'bold' }}
                                >
                                    Admin Dashboard
                                </button>
                            )}
                            <button
                                className="logout-btn"
                                onClick={() => navigate('/my-bookings')}
                                style={{ marginRight: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                            >
                                My Bookings
                            </button>
                            <button id="logout-btn" className="logout-btn" onClick={onLogout}>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="layout-container">
                <aside className="sidebar">
                    <div className="filter-group">
                        <h3>Genres</h3>
                        <div className="filter-list">
                            <div
                                className={`filter-item ${selectedGenre === '' ? 'active' : ''}`}
                                onClick={() => setSelectedGenre('')}
                            >
                                All Genres
                            </div>
                            {genres.map(g => (
                                <div
                                    key={g}
                                    className={`filter-item ${selectedGenre === g ? 'active' : ''}`}
                                    onClick={() => setSelectedGenre(g)}
                                >
                                    {g}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <h3>Language</h3>
                        <div className="filter-list">
                            <div
                                className={`filter-item ${selectedLang === '' ? 'active' : ''}`}
                                onClick={() => setSelectedLang('')}
                            >
                                All Languages
                            </div>
                            {languages.map(l => (
                                <div
                                    key={l}
                                    className={`filter-item ${selectedLang === l ? 'active' : ''}`}
                                    onClick={() => setSelectedLang(l)}
                                >
                                    {l}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="main-content">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>{showingOnly ? '🎥🎟️ Showing Now' : '🎬 All Movies'}</h2>
                            <p style={{ margin: '0.5rem 0 0 0' }}>Explore films in {selectedGenre || 'all genres'} and {selectedLang || 'all languages'}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="search-bar"
                                    placeholder="Search by title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                            </div>

                            <button
                                className={`showing-now-btn ${showingOnly ? 'active' : ''}`}
                                onClick={() => setShowingOnly(!showingOnly)}
                            >
                                {showingOnly ? 'View All' : 'Showing Now'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loader">
                            <div className="loader-spinner"></div>
                            <span>Finding movies…</span>
                        </div>
                    ) : movies.length > 0 ? (
                        <div className="movie-grid">
                            {movies.map((movie) => (
                                <div key={movie.movieId} className="movie-card">
                                    <div className="movie-content">
                                        <h3>{movie.title}</h3>
                                        <p>
                                            {movie.duration} mins &bull;{' '}
                                            ⭐ {movie.rating} &bull;{' '}
                                            {movie.language}
                                        </p>
                                    </div>
                                    <div className="movie-footer">
                                        <span className="genre">{movie.genre || 'General'}</span>
                                        <button className="book-btn" onClick={() => window.location.href = `/movie/${movie.movieId}`}>
                                            View Shows
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">🎬</span>
                            <p>No movies match your filters.</p>
                            <p className="sub-text">Try selecting a different genre or language.</p>
                        </div>
                    )}
                </main>
            </div>
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

    // Refresh user info (loyalty points) on load
    useEffect(() => {
        if (user) {
            const uid = user.userId || user.id;
            fetch(`/api/user/${uid}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const updatedUser = { ...user, ...data.data };
                        setUser(updatedUser);
                        localStorage.setItem('theatro_user', JSON.stringify(updatedUser));
                    }
                })
                .catch(err => console.log("Points sync failed", err));
        }
    }, []); // Run once on startup

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('theatro_user');
        setUser(null);
    };

    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    return (
        <div className={darkMode ? 'dark-mode' : ''}>
            <Router>
                <Routes>
                    <Route
                        path="/"
                        element={
                            user
                                ? <Home user={user} onLogout={handleLogout} isDark={darkMode} onToggleTheme={toggleDarkMode} />
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
                    <Route
                        path="/movie/:id"
                        element={
                            user
                                ? <MovieDetails />
                                : <Navigate to="/login" replace />
                        }
                    />
                    <Route
                        path="/book/:showId"
                        element={
                            user
                                ? <SeatSelection />
                                : <Navigate to="/login" replace />
                        }
                    />
                    <Route
                        path="/my-bookings"
                        element={
                            user
                                ? <MyBookings />
                                : <Navigate to="/login" replace />
                        }
                    />
                    <Route
                        path="/admin/dashboard"
                        element={
                            user && user.isAdmin
                                ? <AdminDashboard />
                                : <Navigate to="/" replace />
                        }
                    />
                    <Route
                        path="/admin/feedback"
                        element={
                            user && user.isAdmin
                                ? <AdminFeedback />
                                : <Navigate to="/" replace />
                        }
                    />
                    <Route
                        path="/feedback"
                        element={
                            user
                                ? <Feedback />
                                : <Navigate to="/login" replace />
                        }
                    />
                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
