import { createContext, useContext, useState } from "react";

const BookingContext = createContext();

export function BookingProvider({ children }) {
    const [booking, setBooking] = useState({
    movieId: null,
    showtimeId: null,
    seats: [],
    food: {},
    foodTotal: 0
});


    const updateBooking = (data) => {
        setBooking(prev => ({ ...prev, ...data }));
    };

    return (
        <BookingContext.Provider value={{ booking, updateBooking }}>
            {children}
        </BookingContext.Provider>
    );
}

export const useBooking = () => useContext(BookingContext);
