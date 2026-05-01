import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import './App.css';

// ── Home / Dashboard ───────────────────────────────────────────────
function Home({ user, onLogout }) {
    const [dbStatus, setDbStatus] = useState(null);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedLang, setSelectedLang] = useState('');

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

        fetch(`/api/movies?${query.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setMovies(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedGenre, selectedLang]);

    const genres = ['Action', 'Drama', 'Comedy', 'Romance', 'Sci-Fi', 'Crime', 'Thriller', 'Horror'];
    const languages = ['English', 'Hindi', 'Urdu'];

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
                    <div className="section-header">
                        <h2>Now Showing</h2>
                        <p>Explore films in {selectedGenre || 'all genres'} and {selectedLang || 'all languages'}</p>
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
                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
