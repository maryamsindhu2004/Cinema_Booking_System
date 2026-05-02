import { useEffect, useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

// Cinema layout config
const ROWS = ["A", "B", "C", "D", "E", "F"];
const COLS = 10;

export default function Step3Seats() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [bookedSeats, setBookedSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);

    // guard
    useEffect(() => {
        if (!booking.movieId || !booking.showtimeId) {
            navigate("/step1");
        }
    }, []);

    // fetch booked seats
    useEffect(() => {
        fetch(`${API}/seats/${booking.showtimeId}`)
            .then(res => res.json())
            .then(data => {
                setBookedSeats(data.booked || []);
            });
    }, [booking.showtimeId]);

    function toggleSeat(seatId) {
        if (bookedSeats.includes(seatId)) return;

        setSelectedSeats(prev =>
            prev.includes(seatId)
                ? prev.filter(id => id !== seatId)
                : [...prev, seatId]
        );
    }

    function next() {
        updateBooking({ seats: selectedSeats });
        navigate("/step4");
    }

    // helper: convert row+col → fake seatId (UI only mapping)
    function generateSeatId(row, col) {
        return `${row}${col}`;
    }

    return (
        <div style={{ padding: 20, textAlign: "center" }}>
            <h2>Select Your Seats</h2>

            {/* SCREEN */}
            <div style={{
                margin: "20px auto",
                width: "80%",
                padding: "10px",
                background: "#ddd",
                borderRadius: 10,
                fontWeight: "bold"
            }}>
                SCREEN THIS WAY
            </div>

            {/* LEGEND */}
            <div style={{ marginBottom: 20 }}>
                <span style={{ marginRight: 10 }}>🟩 Available</span>
                <span style={{ marginRight: 10 }}>🟥 Booked</span>
                <span>🟨 Selected</span>
            </div>

            {/* SEAT GRID */}
            <div>
                {ROWS.map(row => (
                    <div
                        key={row}
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: 8
                        }}
                    >
                        {/* Row label */}
                        <div style={{
                            width: 30,
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center"
                        }}>
                            {row}
                        </div>

                        {/* Seats */}
                        {Array.from({ length: COLS }).map((_, i) => {
                            const col = i + 1;
                            const seatId = generateSeatId(row, col);

                            const isBooked = bookedSeats.includes(seatId);
                            const isSelected = selectedSeats.includes(seatId);

                            let bg = "#ccc"; // available
                            if (isBooked) bg = "#e74c3c"; // red
                            else if (isSelected) bg = "#f1c40f"; // yellow

                            return (
                                <div
                                    key={seatId}
                                    onClick={() => toggleSeat(seatId)}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        margin: 3,
                                        borderRadius: 6,
                                        backgroundColor: bg,
                                        cursor: isBooked ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 10,
                                        userSelect: "none"
                                    }}
                                >
                                    {col}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* BUTTON */}
            <button
                onClick={next}
                disabled={selectedSeats.length === 0}
                style={{
                    marginTop: 20,
                    padding: "10px 20px",
                    background: selectedSeats.length ? "black" : "gray",
                    color: "white",
                    border: "none",
                    borderRadius: 5,
                    cursor: selectedSeats.length ? "pointer" : "not-allowed"
                }}
            >
                Continue ({selectedSeats.length})
            </button>
        </div>
    );
}
