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
  const [showtimes, setShowtimes] = useState([]);
  const [selected, setSelected] = useState(null);

  const { updateBooking } = useBooking();
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
    <div>
      <h2>Select Showtime</h2>

      {showtimes.map(s => (
        <div
          key={s.id}
          onClick={() => setSelected(s.id)}
          style={{
            padding: 10,
            margin: 5,
            border: selected === s.id ? "2px solid green" : "1px solid gray",
            cursor: "pointer"
          }}
        >
          {s.time}
        </div>
      ))}

      <button disabled={!selected} onClick={next}>
        Next
      </button>
    </div>
  );
}
