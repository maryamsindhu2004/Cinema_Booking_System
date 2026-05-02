import { useEffect, useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";

const API = "http://localhost:3000";

export default function Step3Seats() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [seatsData, setSeatsData] = useState([]); // [{seat_id, seat_no, row_no}]
    const [bookedSeats, setBookedSeats] = useState([]); // [seat_id]
    const [selectedSeats, setSelectedSeats] = useState(booking.seats || []);

    useFlowGuard(["movieId", "showtimeId"]);

    useEffect(() => {
        if (!booking.showtimeId) return;
        
        fetch(`${API}/seats/${booking.showtimeId}`)
            .then(res => res.json())
            .then(data => {
                setSeatsData(data.seats || []);
                setBookedSeats(data.booked || []);
            })
            .catch(err => console.error("Failed to fetch seats", err));
    }, [booking.showtimeId]);

    // Group seats by row for rendering
    const rows = seatsData.reduce((acc, seat) => {
        const row = seat.row_no || "Other";
        if (!acc[row]) acc[row] = [];
        acc[row].push(seat);
        return acc;
    }, {});

    // Sort rows alphabetically
    const rowKeys = Object.keys(rows).sort();

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

    return (
        <div style={{ padding: 20, textAlign: "center" }}>
            <h2>Step 3: Select Your Seats</h2>

            <div style={screenLabel}>SCREEN THIS WAY</div>

            {/* LEGEND */}
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "center", gap: 15 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ ...legendBox, backgroundColor: "#ccc" }}></div> Available
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ ...legendBox, backgroundColor: "#e74c3c" }}></div> Booked
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ ...legendBox, backgroundColor: "#f1c40f" }}></div> Selected
                </div>
            </div>

            {/* SEAT GRID */}
            <div style={{ overflowX: "auto", paddingBottom: 20 }}>
                {rowKeys.map(rowKey => (
                    <div key={rowKey} style={{ display: "flex", justifyContent: "center", marginBottom: 8, minWidth: "max-content" }}>
                        <div style={rowLabel}>{rowKey}</div>
                        {rows[rowKey].sort((a,b) => a.seat_no.localeCompare(b.seat_no, undefined, {numeric: true})).map(seat => {
                            const isBooked = bookedSeats.includes(seat.seat_id);
                            const isSelected = selectedSeats.includes(seat.seat_id);

                            let bg = "#ccc";
                            if (isBooked) bg = "#e74c3c";
                            else if (isSelected) bg = "#f1c40f";

                            return (
                                <div
                                    key={seat.seat_id}
                                    onClick={() => toggleSeat(seat.seat_id)}
                                    style={{
                                        ...seatBox,
                                        backgroundColor: bg,
                                        cursor: isBooked ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {seat.seat_no}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* BUTTONS */}
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 10 }}>
                <button onClick={() => navigate("/step2")} style={secondaryBtn}>Back</button>
                <button
                    onClick={next}
                    disabled={selectedSeats.length === 0}
                    style={{
                        ...primaryBtn,
                        background: selectedSeats.length ? "black" : "gray",
                        cursor: selectedSeats.length ? "pointer" : "not-allowed"
                    }}
                >
                    Continue ({selectedSeats.length})
                </button>
            </div>
        </div>
    );
}

const screenLabel = {
    margin: "20px auto",
    width: "80%",
    padding: "10px",
    background: "#ddd",
    borderRadius: 10,
    fontWeight: "bold"
};

const legendBox = { width: 20, height: 20, borderRadius: 4 };

const rowLabel = { width: 30, fontWeight: "bold", display: "flex", alignItems: "center" };

const seatBox = {
    width: 35,
    height: 35,
    margin: 3,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    userSelect: "none",
    transition: "0.2s"
};

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
