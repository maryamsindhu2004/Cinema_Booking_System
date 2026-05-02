-- Stored procedures for the Cinema Booking System
-- You can keep your procedure definitions here for better organization.

CREATE PROCEDURE sp_CreateBooking
    @user_id INT,
    @show_id INT
AS
BEGIN
    INSERT INTO Bookings(user_id, show_id)
    VALUES (@user_id, @show_id);
END;
GO

CREATE PROCEDURE sp_GetAvailableSeats
    @show_id INT
AS
BEGIN
    SELECT s.*
    FROM Seats s
    JOIN Screens sc ON s.screen_id = sc.screen_id
    JOIN Shows sh ON sh.screen_id = sc.screen_id
    WHERE sh.show_id = @show_id
    AND NOT EXISTS (
        SELECT 1 FROM BookingSeats bs
        JOIN Bookings b ON bs.booking_id = b.booking_id
        WHERE bs.seat_id = s.seat_id AND b.show_id = @show_id
    );
END;
GO
