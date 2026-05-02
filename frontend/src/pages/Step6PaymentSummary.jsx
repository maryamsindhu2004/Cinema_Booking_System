import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";
import { useState } from "react";

export default function Step6Payment() {
    const { booking } = useBooking();
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
                alert(data.message);
                return;
            }

            // store booking id for step 7
            localStorage.setItem("bookingId", data.booking_id);

            navigate("/step7");

        } catch (err) {
            console.error(err);
            alert("Booking failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: 20 }}>
            <h2>Payment Summary</h2>

            <pre>{JSON.stringify(booking, null, 2)}</pre>

            <button
                onClick={confirm}
                disabled={loading}
                style={{
                    padding: 10,
                    background: "black",
                    color: "white",
                    border: "none"
                }}
            >
                {loading ? "Processing..." : "Confirm & Pay"}
            </button>
        </div>
    );
}
