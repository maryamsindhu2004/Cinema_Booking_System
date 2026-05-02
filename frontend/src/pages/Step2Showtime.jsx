import { useEffect, useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";
import Layout from "../components/Layout";

const mockShowtimes = [
  { id: 1, time: "10:00 AM", type: "Morning Show" },
  { id: 2, time: "02:00 PM", type: "Matinee Show" },
  { id: 3, time: "06:00 PM", type: "Evening Show" },
  { id: 4, time: "09:00 PM", type: "Night Show" }
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
    <Layout currentStep={2} title="Select Showtime">
      <div className="info-box">
        <strong>ℹ️ Pick a time</strong> that works best for your schedule.
      </div>

      <div className="grid">
        {showtimes.map(s => (
          <div
            key={s.id}
            className={`card ${selected === s.id ? 'selected' : ''}`}
            onClick={() => setSelected(s.id)}
          >
            <div className="card-icon">🕒</div>
            <div className="card-title">{s.time}</div>
            <div className="card-details">{s.type}</div>
            <div className="card-details">Available Seats: 45</div>
          </div>
        ))}
      </div>

      <div className="button-group">
        <button className="btn-secondary" onClick={() => navigate("/step1")}>← Back</button>
        <button className="btn-primary" disabled={!selected} onClick={next}>
          Continue to Seats →
        </button>
      </div>
    </Layout>
  );
}
