import { useState, useEffect } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";

export default function Step5CustomerDetails() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: ""
    });

    // guard (must come from Step 4)
    useEffect(() => {
        if (!booking.seats || booking.seats.length === 0) {
            navigate("/step1");
        }
    }, []);

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
            <h2>Customer Details</h2>

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

            {/* PREVIEW */}
            <div style={{
                marginTop: 20,
                padding: 10,
                background: "#f4f4f4",
                borderRadius: 5,
                fontSize: 12
            }}>
                <strong>Preview:</strong>
                <pre>{JSON.stringify(form, null, 2)}</pre>
            </div>

            {/* NEXT BUTTON */}
            <button
                onClick={next}
                style={{
                    marginTop: 15,
                    width: "100%",
                    padding: 10,
                    background: "black",
                    color: "white",
                    border: "none",
                    borderRadius: 5
                }}
            >
                Continue to Payment
            </button>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: 10,
    marginTop: 5,
    border: "1px solid #ccc",
    borderRadius: 5
};
