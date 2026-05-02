import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div>
            <h1>Cinema Booking</h1>
            <Link to="/step1">
                <button>Start Booking</button>
            </Link>
        </div>
    );
}
