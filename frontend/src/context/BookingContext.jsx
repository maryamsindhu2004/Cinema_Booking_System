import { createContext, useContext, useState, useEffect } from "react";

const BookingContext = createContext();

const initialState = {
    movieId: null,
    showtimeId: null,
    seats: [],
    food: {},
    foodTotal: 0,
    customer: null
};

export function BookingProvider({ children }) {
    // Load from localStorage if exists
    const [booking, setBooking] = useState(() => {
        const saved = localStorage.getItem("current_booking");
        return saved ? JSON.parse(saved) : initialState;
    });

    // Save to localStorage whenever booking changes
    useEffect(() => {
        localStorage.setItem("current_booking", JSON.stringify(booking));
    }, [booking]);

    const updateBooking = (data) => {
        setBooking(prev => ({ ...prev, ...data }));
    };

    const clearBooking = () => {
        setBooking(initialState);
        localStorage.removeItem("current_booking");
    };

    return (
        <BookingContext.Provider value={{ booking, updateBooking, clearBooking }}>
            {children}
        </BookingContext.Provider>
    );
}

export const useBooking = () => useContext(BookingContext);
