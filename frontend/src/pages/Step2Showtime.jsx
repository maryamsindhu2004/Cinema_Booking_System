import { useEffect, useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";

const mockShowtimes = [
  { id: 1, time: "10:00 AM" },
  { id: 2, time: "02:00 PM" },
  { id: 3, time: "06:00 PM" }
];

export default function Step2Showtime() {
  const { booking, updateBooking } = useBooking();
  const [showtimes, setShowtimes] = useState([]);
  const [selected, setSelected] = useState(booking.showtimeId);

  const navigate = useNavigate();

  useFlowGuard(["movieId"]);

  useEffect(() => {
    setShowtimes(mockShowtimes);
  }, []);

  function next() {
    updateBooking({ showtimeId: selected });
    navigate("/step3");
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Step 2: Select Showtime</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {showtimes.map(s => (
          <div
            key={s.id}
            onClick={() => setSelected(s.id)}
            style={{
              padding: "15px 30px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "0.2s",
              border: selected === s.id ? "3px solid #000" : "1px solid #ccc",
              backgroundColor: selected === s.id ? "#f0f0f0" : "#fff"
            }}
          >
            {s.time}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={() => navigate("/step1")} style={secondaryBtn}>Back</button>
        <button disabled={!selected} onClick={next} style={primaryBtn}>
          Continue to Seats
        </button>
      </div>
    </div>
  );
}

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
