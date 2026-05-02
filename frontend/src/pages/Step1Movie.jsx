import { useEffect, useState } from "react";
import { getMovies } from "../services/api";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function Step1Movie() {
    const [movies, setMovies] = useState([]);
    const { booking, updateBooking } = useBooking();
    const [selected, setSelected] = useState(booking.movieId);

    const navigate = useNavigate();

    useEffect(() => {
        getMovies().then(setMovies);
    }, []);

    function next() {
        updateBooking({ movieId: selected });
        navigate("/step2");
    }

    return (
        <Layout currentStep={1} title="Now Showing">
            <div className="info-box">
                <strong>ℹ️ Select a movie</strong> from the options below to get started.
            </div>

            <div className="grid">
                {movies.map(m => (
                    <div
                        key={m.movie_id}
                        className={`card ${selected === m.movie_id ? 'selected' : ''}`}
                        onClick={() => setSelected(m.movie_id)}
                    >
                        <div className="card-icon">🎬</div>
                        <div className="card-title">{m.title}</div>
                        <div className="card-details">{m.genre || 'Action / Drama'}</div>
                        <div className="card-details">{m.duration || '120'} min</div>
                        <div className="card-details">🌐 {m.language || 'English'}</div>
                        <div className="card-details">{m.rating || '⭐️ 4.5'}</div>
                    </div>
                ))}
            </div>

            <div className="button-group">
                <button className="btn-secondary" onClick={() => navigate("/")}>Back to Home</button>
                <button className="btn-primary" disabled={!selected} onClick={next}>
                    Continue to Showtimes →
                </button>
            </div>
        </Layout>
    );
}
