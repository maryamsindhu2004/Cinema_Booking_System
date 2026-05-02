import { useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";

export default function Step5CustomerDetails() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [form, setForm] = useState(booking.customer || {
        full_name: "",
        email: "",
        phone: ""
    });

    // standardized guard
    useFlowGuard(["movieId", "showtimeId", "seats"]);

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    function next() {
        // basic validation
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
        <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
            <h2>Step 5: Customer Details</h2>

            {/* NAME */}
            <div style={{ marginBottom: 10 }}>
                <label>Full Name</label>
                <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Enter full name"
                />
            </div>

            {/* EMAIL */}
            <div style={{ marginBottom: 10 }}>
                <label>Email</label>
                <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Enter email"
                />
            </div>

            {/* PHONE */}
            <div style={{ marginBottom: 10 }}>
                <label>Phone</label>
                <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Enter phone number"
                />
            </div>

            {/* NAVIGATION */}
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button onClick={() => navigate("/step4")} style={secondaryBtn}>Back</button>
                <button onClick={next} style={primaryBtn}>
                    Continue to Summary
                </button>
            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: 10,
    marginTop: 5,
    border: "1px solid #ccc",
    borderRadius: 5,
    boxSizing: "border-box"
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
