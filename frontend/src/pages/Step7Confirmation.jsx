import { useEffect, useState } from "react";

export default function Step7Confirmation() {
    const [data, setData] = useState(null);
    const bookingId = localStorage.getItem("bookingId");

    useEffect(() => {
        if (!bookingId) return;

        fetch(`http://localhost:3000/booking/${bookingId}/full`)
            .then(res => res.json())
            .then(setData);
    }, []);

    if (!data) {
        return <h3>Loading receipt...</h3>;
    }

    const { booking, seats, food, total } = data;

    return (
        <div style={container}>
            <h1>🎬 Booking Confirmed</h1>

            <div style={card}>
                <h2>🎟 Ticket Receipt</h2>

                <p><b>Booking ID:</b> {booking.booking_id}</p>
                <p><b>Name:</b> {booking.full_name}</p>
                <p><b>Email:</b> {booking.email}</p>
                <p><b>Movie:</b> {booking.title}</p>
                <p><b>Date:</b> {booking.show_date}</p>
                <p><b>Time:</b> {booking.start_time}</p>
            </div>

            {/* SEATS */}
            <div style={card}>
                <h3>🪑 Seats</h3>
                {seats.map((s, i) => (
                    <span key={i} style={badge}>
                        {s.row_no}{s.seat_no}
                    </span>
                ))}
            </div>

            {/* FOOD */}
            {food.length > 0 && (
                <div style={card}>
                    <h3>🍿 Food</h3>
                    {food.map((f, i) => (
                        <p key={i}>
                            {f.item_name} × {f.quantity} — Rs {f.price}
                        </p>
                    ))}
                </div>
            )}

            {/* TOTAL */}
            <div style={totalBox}>
                <h2>Total Paid: Rs {total}</h2>
            </div>

            {/* ACTIONS */}
            <button
                onClick={() => window.print()}
                style={btn}
            >
                Print Ticket
            </button>
        </div>
    );
}

const container = {
    padding: 20,
    maxWidth: 500,
    margin: "auto",
    fontFamily: "Arial"
};

const card = {
    padding: 15,
    marginTop: 15,
    border: "1px solid #ddd",
    borderRadius: 8
};

const badge = {
    display: "inline-block",
    padding: "5px 10px",
    margin: 3,
    background: "#000",
    color: "#fff",
    borderRadius: 5
};

const totalBox = {
    marginTop: 20,
    padding: 15,
    background: "#f5f5f5",
    textAlign: "center"
};

const btn = {
    marginTop: 20,
    width: "100%",
    padding: 10,
    background: "black",
    color: "white",
    border: "none"
};
