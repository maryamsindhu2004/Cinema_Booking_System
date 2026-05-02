import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";

export default function useFlowGuard(requiredFields = []) {
    const { booking } = useBooking();
    const navigate = useNavigate();

    useEffect(() => {
        const isValid = requiredFields.every(field => booking[field]);

        if (!isValid) {
            navigate("/step1");
        }
    }, []);
}
