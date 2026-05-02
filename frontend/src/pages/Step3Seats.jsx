import { useEffect, useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";
import Layout from "../components/Layout";

const API = "http://localhost:3000";

export default function Step3Seats() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [seatsData, setSeatsData] = useState([]); 
    const [bookedSeats, setBookedSeats] = useState([]); 
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

    const rows = seatsData.reduce((acc, seat) => {
        const row = seat.row_no || "Other";
        if (!acc[row]) acc[row] = [];
        acc[row].push(seat);
        return acc;
    }, {});

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
        <Layout currentStep={3} title="Select Your Seats">
            <div className="info-box">
                <strong>ℹ️ Choose your favorite spot</strong> from the layout below.
            </div>

            <div style={{
                background: "linear-gradient(to bottom, #ccc, transparent)",
                height: "40px",
                borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8em",
                fontWeight: "bold",
                color: "#666",
                marginBottom: "40px",
                borderTop: "3px solid #667eea"
            }}>
                SCREEN THIS WAY
            </div>

            {/* LEGEND */}
            <div style={{ marginBottom: "30px", display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9em" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: "#e9ecef", border: "1px solid #ddd" }}></div> Available
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9em" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: "#dc3545" }}></div> Booked
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9em" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: "#667eea" }}></div> Selected
                </div>
            </div>

            {/* SEAT GRID */}
            <div style={{ overflowX: "auto", paddingBottom: "20px", textAlign: "center" }}>
                {rowKeys.map(rowKey => (
                    <div key={rowKey} style={{ display: "flex", justifyContent: "center", marginBottom: "8px", minWidth: "max-content" }}>
                        <div style={{ width: "30px", fontWeight: "bold", display: "flex", alignItems: "center", color: "#666" }}>{rowKey}</div>
                        {rows[rowKey].sort((a,b) => a.seat_no.localeCompare(b.seat_no, undefined, {numeric: true})).map(seat => {
                            const isBooked = bookedSeats.includes(seat.seat_id);
                            const isSelected = selectedSeats.includes(seat.seat_id);

                            let bg = "#e9ecef";
                            let color = "#333";
                            if (isBooked) {
                                bg = "#dc3545";
                                color = "white";
                            } else if (isSelected) {
                                bg = "#667eea";
                                color = "white";
                            }

                            return (
                                <div
                                    key={seat.seat_id}
                                    onClick={() => toggleSeat(seat.seat_id)}
                                    style={{
                                        width: "35px",
                                        height: "35px",
                                        margin: "3px",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "10px",
                                        userSelect: "none",
                                        transition: "0.2s",
                                        backgroundColor: bg,
                                        color: color,
                                        border: isSelected ? "none" : "1px solid #ddd",
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

            {selectedSeats.length > 0 && (
                <div className="summary" style={{ padding: "15px", marginTop: "20px" }}>
                    <div className="summary-item" style={{ border: "none", padding: 0 }}>
                        <span className="summary-label">Selected Seats:</span>
                        <span className="summary-value" style={{ color: "#667eea" }}>
                            {selectedSeats.length} Seats
                        </span>
                    </div>
                </div>
            )}

            <div className="button-group">
                <button className="btn-secondary" onClick={() => navigate("/step2")}>← Back</button>
                <button
                    className="btn-primary"
                    onClick={next}
                    disabled={selectedSeats.length === 0}
                >
                    Continue to Food ({selectedSeats.length}) →
                </button>
            </div>
        </Layout>
    );
}
