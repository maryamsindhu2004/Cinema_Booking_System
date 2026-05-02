import { useEffect, useState } from "react";
import { getMovies } from "../services/api";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";

export default function Step1Movie() {
    const [movies, setMovies] = useState([]);
    const [selected, setSelected] = useState(null);

    const { updateBooking } = useBooking();
    const navigate = useNavigate();

    useEffect(() => {
        getMovies().then(setMovies);
    }, []);

    function next() {
        updateBooking({ movieId: selected });
        navigate("/step2");
    }

    return (
        <div>
            <h2>Select Movie</h2>

            {movies.map(m => (
                <div
                    key={m.movie_id}
                    onClick={() => setSelected(m.movie_id)}
                    style={{
                        border: selected === m.movie_id ? "2px solid green" : "1px solid gray"
                    }}
                >
                    {m.title}
                </div>
            ))}

            <button disabled={!selected} onClick={next}>
                Next
            </button>
        </div>
    );
}
