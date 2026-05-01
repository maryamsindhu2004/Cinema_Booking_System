import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingModal from './BookingModal';
import './App.css';

const S = {
  btn: (c='#e94560') => ({ background:c, color:'#fff', border:'none', padding:'10px 20px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:14 }),
  input: { padding:'10px 14px', background:'#1a1a2e', border:'1px solid #444', borderRadius:8, color:'#fff', fontSize:14 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal: { background:'#1a1a2e', borderRadius:16, width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', padding:28, border:'1px solid #2a2a4a' },
  card: { background:'#0f0f23', border:'1px solid #2a2a4a', borderRadius:10, padding:'14px 18px', marginBottom:10 },
  sub: { color:'#aaa', fontSize:13 },
  row: { display:'flex', justifyContent:'space-between', alignItems:'center' },
};

function BookingHistory({ user, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchBookings = () => {
    fetch(`/api/bookings/${user.id}`).then(r=>r.json()).then(d=>{
      if(d.success) setBookings(d.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchBookings();
  }, [user.id]);

  const cancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setMsg('');
    const res = await fetch('/api/cancel-booking', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ bookingId, userId: user.id })
    });
    const data = await res.json();
    if(data.success) {
      setMsg('✅ Booking cancelled successfully.');
      fetchBookings(); // Refresh the list
    } else {
      setMsg('❌ ' + (data.message || 'Could not cancel.'));
    }
  };

  const statusColor = s => ({ Paid:'#4CAF50', Pending:'#f0c040', Refunded:'#aaa', Failed:'#e94560' }[s]||'#aaa');

  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.modal}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2 style={{color:'#fff',margin:0}}>📋 My Bookings</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#aaa',fontSize:24,cursor:'pointer'}}>✕</button>
        </div>
        {msg && <p style={{color:msg.startsWith('✅')?'#4CAF50':'#e94560',fontSize:13,marginBottom:12}}>{msg}</p>}
        {loading ? <p style={S.sub}>Loading…</p>
          : bookings.length===0 ? <p style={S.sub}>No bookings yet. Book your first movie!</p>
          : bookings.map(b=>(
            <div key={b.bookingId} style={{...S.card,display:'flex',flexDirection:'column',gap:6}}>
              <div style={S.row}>
                <span style={{color:'#fff',fontWeight:700,fontSize:15}}>{b.MovieTitle}</span>
                <span style={{color:statusColor(b.paymentStatus),fontWeight:700}}>{b.paymentStatus}</span>
              </div>
              <div style={S.sub}>{b.CinemaName} • {b.ScreenType}</div>
              <div style={S.sub}>{b.showDate} at {String(b.startTime).slice(0,5)} • {b.SeatCount} seat(s)</div>
              <div style={S.row}>
                <span style={{...S.sub}}>Booking #{b.bookingId}</span>
                <span style={{color:'#e94560',fontWeight:700}}>Rs. {b.totalAmount}</span>
              </div>
              {b.paymentStatus !== 'Refunded' && (
                <button onClick={()=>cancel(b.bookingId)} style={{...S.btn('#2a2a4a'),padding:'6px 14px',fontSize:12,alignSelf:'flex-start',marginTop:4}}>
                  Cancel Booking
                </button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

function Home({ user, onLogout }) {
  const [dbStatus, setDbStatus] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingMovie, setBookingMovie] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  
  const [showReviews, setShowReviews] = useState(null);
  const [movieReviews, setMovieReviews] = useState([]);

  const fetchMovies = () => {
    fetch('/api/movies').then(r=>r.json()).then(d=>{ if(d.success) setMovies(d.data); setLoading(false); }).catch(()=>setLoading(false));
  };

  useEffect(() => {
    fetch('/api/db-test').then(r=>r.json()).then(d=>setDbStatus(d)).catch(()=>setDbStatus({success:false}));
    fetchMovies();
  }, []);

  const filtered = movies.filter(m =>
    (!search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.genre||'').toLowerCase().includes(search.toLowerCase())) &&
    (!langFilter || m.language === langFilter)
  );
  const languages = [...new Set(movies.map(m=>m.language).filter(Boolean))];

  return (
    <div className="App">
      <header className="hero-section">
        <div className="header-top">
          <div className="brand">
            <span className="brand-icon">🎭</span>
            <h1 className="title">THEATRO <span className="highlight">Cinemas</span></h1>
          </div>
          <div className="header-right">
            {dbStatus && (
              <div className={`status-badge ${dbStatus.success?'success':'error'}`}>
                <span className="indicator"></span>DB {dbStatus.success?'Connected':'Offline'}
              </div>
            )}
            <button onClick={()=>setShowHistory(true)} style={{...S.btn('#0f0f23'),border:'1px solid #e94560',padding:'8px 16px',marginRight:8}}>
              📋 My Bookings
            </button>
            <div className="user-pill">
              <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.name}</span>
              <button id="logout-btn" className="logout-btn" onClick={onLogout}>Sign Out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="section-header">
          <h2>Now Showing</h2>
          <p>Book your favourite film today</p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{display:'flex',gap:10,marginBottom:24,flexWrap:'wrap'}}>
          <input placeholder="🔍 Search movies or genres…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{...S.input,flex:1,minWidth:200}} />
          <select value={langFilter} onChange={e=>setLangFilter(e.target.value)} style={{...S.input,minWidth:140}}>
            <option value="">All Languages</option>
            {languages.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          {(search||langFilter) && (
            <button onClick={()=>{setSearch('');setLangFilter('');}} style={{...S.btn('#333'),padding:'8px 14px'}}>✕ Clear</button>
          )}
        </div>

        {loading ? (
          <div className="loader"><div className="loader-spinner"></div><span>Loading movies…</span></div>
        ) : filtered.length > 0 ? (
          <div className="movie-grid">
            {filtered.map((movie,i) => (
              <div key={movie.movieId} className="movie-card">
                  <div className="movie-info">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <h3>{movie.title}</h3>
                      <span className="rating-badge" style={{background:'var(--primary)',padding:'2px 8px',borderRadius:6,fontSize:12,fontWeight:700}}>{movie.rating}</span>
                    </div>
                    <p className="movie-meta">{movie.language} • {movie.duration} mins</p>
                    <p className="movie-desc">{movie.description?.substring(0, 100)}...</p>
                    
                    <div style={{display:'flex',gap:10}}>
                      <button className="book-btn" onClick={() => setBookingMovie(movie)}>Book Tickets</button>
                      
                      <button className="secondary-btn" onClick={async () => {
                        if(showReviews === movie.movieId) setShowReviews(null);
                        else {
                          const res = await fetch(`/api/movie-feedback/${movie.movieId}`);
                          const d = await res.json();
                          setMovieReviews(d.data || []);
                          setShowReviews(movie.movieId);
                        }
                      }}>Reviews</button>
                    </div>

                    {showReviews === movie.movieId && (
                      <div className="review-dropdown animated-fade-in">
                        <h4>Community Reviews</h4>
                        {movieReviews.length === 0 ? <p className="empty-msg">No reviews yet.</p> : movieReviews.map((r,i)=>(
                          <div key={i} className="mini-review">
                            <div className="r-header">
                              <strong>{r.UserName}</strong>
                              <span>{'★'.repeat(r.rating)}</span>
                            </div>
                            <p>{r.comments}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">🎬</span>
            <p>{search||langFilter ? 'No movies match your search.' : 'No movies available.'}</p>
          </div>
        )}
      </main>

      {bookingMovie && <BookingModal movie={bookingMovie} user={user} onClose={() => { setBookingMovie(null); fetchMovies(); }} />}
      {showHistory && <BookingHistory user={user} onClose={()=>setShowHistory(false)} />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('theatro_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home user={user} onLogout={()=>{ localStorage.removeItem('theatro_user'); setUser(null); }} /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={u=>setUser(u)} />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register onLogin={u=>setUser(u)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
