import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";
import { useState } from "react";

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

            // store booking id for step 7
            localStorage.setItem("bookingId", data.booking_id);
            
            // Clear current booking state since it's finished
            clearBooking();

            navigate("/step7");

        } catch (err) {
            console.error(err);
            alert("Booking failed due to network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
            <h2>Step 6: Payment Summary</h2>

            <div style={summaryBox}>
                <h3>Review Your Booking</h3>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                    {JSON.stringify(booking, null, 2)}
                </pre>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button onClick={() => navigate("/step5")} style={secondaryBtn}>Back</button>
                <button
                    onClick={confirm}
                    disabled={loading}
                    style={primaryBtn}
                >
                    {loading ? "Processing..." : "Confirm & Pay"}
                </button>
            </div>
        </div>
    );
}

const summaryBox = {
    padding: 15,
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#f9f9f9"
};

const primaryBtn = {
    padding: "10px 20px",
    background: "black",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    flex: 1
};

const secondaryBtn = {
    padding: "10px 20px",
    background: "white",
    color: "black",
    border: "1px solid black",
    borderRadius: 5,
    cursor: "pointer"
};
