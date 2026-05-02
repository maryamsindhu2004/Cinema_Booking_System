import { useEffect, useState } from "react";
import { getMovies } from "../services/api";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";

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
        <div style={{ padding: 20 }}>
            <h2>Step 1: Select Movie</h2>

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                {movies.map(m => (
                    <div
                        key={m.movie_id}
                        onClick={() => setSelected(m.movie_id)}
                        style={{
                            padding: 15,
                            borderRadius: 8,
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "0.2s",
                            border: selected === m.movie_id ? "3px solid #000" : "1px solid #ccc",
                            backgroundColor: selected === m.movie_id ? "#f0f0f0" : "#fff"
                        }}
                    >
                        {m.title}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button onClick={() => navigate("/")} style={secondaryBtn}>Back to Home</button>
                <button disabled={!selected} onClick={next} style={primaryBtn}>
                    Continue to Showtimes
                </button>
            </div>
        </div>
    );
}

const primaryBtn = {
    padding: "10px 20px",
    background: "black",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer"
};

const secondaryBtn = {
    padding: "10px 20px",
    background: "white",
    color: "black",
    border: "1px solid black",
    borderRadius: 5,
    cursor: "pointer"
};
