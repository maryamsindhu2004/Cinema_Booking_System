import { useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";
import Layout from "../components/Layout";

export default function Step5CustomerDetails() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [form, setForm] = useState(booking.customer || {
        full_name: "",
        email: "",
        phone: ""
    });

    useFlowGuard(["movieId", "showtimeId", "seats"]);

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    function next() {
        if (!form.full_name || !form.email || !form.phone) {
            alert("Please fill all fields");
            return;
        }

        updateBooking({
            customer: form
        });

        navigate("/step6");
    }

    return (
        <Layout currentStep={6} title="Contact Information">
            <div className="info-box">
                <strong>ℹ️ Almost there!</strong> Please provide your details for the booking.
            </div>

            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Full Name</label>
                    <input
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="e.g. John Doe"
                    />
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Email Address</label>
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="e.g. john@example.com"
                    />
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Phone Number</label>
                    <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="e.g. +92 300 1234567"
                    />
                </div>

                <div className="button-group" style={{ marginTop: "40px" }}>
                    <button className="btn-secondary" onClick={() => navigate("/step4")}>← Back</button>
                    <button className="btn-primary" onClick={next}>
                        Continue to Summary →
                    </button>
                </div>
            </div>
        </Layout>
    );
}

const inputStyle = {
    width: "100%",
    padding: "12px 15px",
    border: "2px solid #ddd",
    borderRadius: "8px",
    fontSize: "1em",
    outline: "none",
    transition: "border-color 0.3s ease",
    boxSizing: "border-box"
};
