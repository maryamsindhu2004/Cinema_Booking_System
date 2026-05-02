import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

export default function Step7Confirmation() {
    const [data, setData] = useState(null);
    const bookingId = localStorage.getItem("bookingId");

    useEffect(() => {
        if (!bookingId) return;

        fetch(`http://localhost:3000/booking/${bookingId}/full`)
            .then(res => res.json())
            .then(setData)
            .catch(err => console.error("Failed to fetch receipt", err));
    }, [bookingId]);

    if (!data || !data.success) {
        return (
            <Layout currentStep={7} title="Booking Confirmation">
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <div className="card-icon">❌</div>
                    <p>{data?.message || "Generating your digital ticket..."}</p>
                    <Link to="/" className="btn-primary" style={{ marginTop: "20px", textDecoration: "none" }}>Back to Home</Link>
                </div>
            </Layout>
        );
    }

    const { booking, seats, food, total } = data;

    return (
        <Layout currentStep={7} title="">
            <div className="confirmation">
                <div className="confirmation-icon">✅</div>
                <h2 className="confirmation-title">Booking Confirmed!</h2>
                <p className="confirmation-message">
                    Thank you, <strong>{booking.full_name}</strong>! Your booking has been successfully processed. 
                    A confirmation email has been sent to {booking.email}.
                </p>

                <div className="booking-ref">
                    <div className="booking-ref-label">YOUR BOOKING REFERENCE</div>
                    <div className="booking-ref-number">#{booking.booking_id}</div>
                </div>

                <div className="summary" style={{ textAlign: "left" }}>
                    <h3 style={{ borderBottom: "2px solid #ddd", paddingBottom: "10px", marginBottom: "15px" }}>
                        🎟 Ticket Details
                    </h3>
                    <div className="summary-item">
                        <span className="summary-label">Movie:</span>
                        <span className="summary-value">{booking.title}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Showtime:</span>
                        <span className="summary-value">{booking.start_time} • {new Date(booking.show_date).toLocaleDateString()}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Seats:</span>
                        <div className="summary-value">
                            {seats.map((s, i) => (
                                <span key={i} style={{ 
                                    background: "#667eea", 
                                    color: "white", 
                                    padding: "2px 8px", 
                                    borderRadius: "4px", 
                                    marginLeft: "5px",
                                    fontSize: "0.8em"
                                }}>
                                    {s.row_no}{s.seat_no}
                                </span>
                            ))}
                        </div>
                    </div>

                    {food.length > 0 && (
                        <>
                            <h3 style={{ marginTop: "20px", borderBottom: "2px solid #ddd", paddingBottom: "10px", marginBottom: "15px" }}>
                                🍿 Food & Snacks
                            </h3>
                            {food.map((f, i) => (
                                <div key={i} className="summary-item">
                                    <span className="summary-label">{f.item_name} × {f.quantity}</span>
                                    <span className="summary-value">Rs. {f.price}</span>
                                </div>
                            ))}
                        </>
                    )}

                    <div className="summary-item summary-total">
                        <span className="summary-label">Total Amount Paid:</span>
                        <span className="summary-value total-amount">Rs. {total}</span>
                    </div>
                </div>

                <div className="button-group">
                    <button className="btn-secondary" onClick={() => window.print()}>🖨 Print Ticket</button>
                    <Link to="/" className="btn-primary" style={{ textDecoration: "none" }}>Book Another Movie →</Link>
                </div>
            </div>
        </Layout>
    );
}
