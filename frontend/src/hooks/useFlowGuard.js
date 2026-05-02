import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";

export default function useFlowGuard(requiredFields = []) {
    const { booking } = useBooking();
    const navigate = useNavigate();

    useEffect(() => {
        const isValid = requiredFields.every(field => {
            const val = booking[field];
            
            if (val === null || val === undefined) return false;
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === 'object') return Object.keys(val).length > 0;
            
            return !!val;
        });

        if (!isValid) {
            console.warn(`Flow guard failed for fields: ${requiredFields.join(', ')}. Redirecting to /step1`);
            navigate("/step1");
        }
    }, [booking, navigate]); // React to context changes
}
