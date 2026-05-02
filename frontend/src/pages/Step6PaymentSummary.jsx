import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";
import { useState } from "react";
import Layout from "../components/Layout";

export default function Step6Payment() {
    const { booking, clearBooking } = useBooking();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    useFlowGuard(["movieId", "showtimeId", "seats", "customer"]);

    async function confirm() {
        try {
            setLoading(true);

            const res = await fetch("http://localhost:3000/booking/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(booking)
            });

            const data = await res.json();

            if (!data.success) {
                alert(data.message || "Booking failed");
                return;
            }

            localStorage.setItem("bookingId", data.booking_id);
            clearBooking();
            navigate("/step7");

        } catch (err) {
            console.error(err);
            alert("Booking failed due to network error");
        } finally {
            setLoading(false);
        }
    }

    const foodItems = Object.values(booking.food || {});

    return (
        <Layout currentStep={6} title="Payment Summary">
            <div className="info-box">
                <strong>ℹ️ Review your selection</strong> before proceeding to payment.
            </div>

            <div className="summary">
                <h3>Booking Details</h3>
                <div className="summary-item">
                    <span className="summary-label">Movie ID:</span>
                    <span className="summary-value">{booking.movieId}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Showtime ID:</span>
                    <span className="summary-value">{booking.showtimeId}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Seats:</span>
                    <span className="summary-value">{booking.seats?.length} Selected</span>
                </div>
                
                {foodItems.length > 0 && (
                    <>
                        <h3 style={{ marginTop: "20px" }}>Food & Beverages</h3>
                        {foodItems.map(c => (
                            <div key={c.item.item_id} className="summary-item">
                                <span className="summary-label">{c.item.item_name} (x{c.qty})</span>
                                <span className="summary-value">Rs. {c.qty * c.item.price}</span>
                            </div>
                        ))}
                    </>
                )}

                <h3 style={{ marginTop: "20px" }}>Customer Info</h3>
                <div className="summary-item">
                    <span className="summary-label">Name:</span>
                    <span className="summary-value">{booking.customer?.full_name}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Email:</span>
                    <span className="summary-value">{booking.customer?.email}</span>
                </div>

                <div className="summary-item summary-total">
                    <span className="summary-label">Total Amount:</span>
                    <span className="summary-value total-amount">
                        Rs. {(booking.foodTotal || 0) + (booking.seats?.length * 500 || 0)}
                    </span>
                </div>
            </div>

            <div className="button-group">
                <button className="btn-secondary" onClick={() => navigate("/step5")}>← Back</button>
                <button
                    className="btn-success"
                    onClick={confirm}
                    disabled={loading}
                    style={{ flex: 1 }}
                >
                    {loading ? "Processing..." : "Confirm & Pay Now →"}
                </button>
            </div>
        </Layout>
    );
}
