

/* =========================================================
   CINEMA BOOKING SYSTEM - INDUSTRY GRADE (BCNF CLEAN)
   ========================================================= */

SET NOCOUNT ON;
GO

/* =========================================================
   1. USERS
   ========================================================= */
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    user_role VARCHAR(20) CHECK (user_role IN ('Customer','Admin')),
    created_at DATETIME DEFAULT GETDATE()
);
GO

/* =========================================================
   2. CINEMAS
   ========================================================= */
CREATE TABLE Cinemas (
    cinema_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(200) NOT NULL,
    location VARCHAR(255) NOT NULL,
    contact VARCHAR(50),
    is_active BIT DEFAULT 1
);
GO

/* =========================================================
   3. SCREEN TYPES
   ========================================================= */
CREATE TABLE ScreenTypes (
    screen_type_id INT PRIMARY KEY IDENTITY(1,1),
    type_name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) DEFAULT 0
);
GO

/* =========================================================
   4. SCREENS
   ========================================================= */
CREATE TABLE Screens (
    screen_id INT PRIMARY KEY IDENTITY(1,1),
    cinema_id INT NOT NULL,
    screen_type_id INT NOT NULL,

    FOREIGN KEY (cinema_id) REFERENCES Cinemas(cinema_id),
    FOREIGN KEY (screen_type_id) REFERENCES ScreenTypes(screen_type_id)
);
GO

/* =========================================================
   5. SEAT TYPES
   ========================================================= */
CREATE TABLE SeatTypes (
    seat_type_id INT PRIMARY KEY IDENTITY(1,1),
    category VARCHAR(50) NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0
);
GO

/* =========================================================
   6. SEATS
   ========================================================= */
CREATE TABLE Seats (
    seat_id INT PRIMARY KEY IDENTITY(1,1),
    screen_id INT NOT NULL,
    seat_type_id INT NOT NULL,
    seat_no VARCHAR(10) NOT NULL,
    row_no VARCHAR(5),

    UNIQUE(screen_id, seat_no),

    FOREIGN KEY (screen_id) REFERENCES Screens(screen_id),
    FOREIGN KEY (seat_type_id) REFERENCES SeatTypes(seat_type_id)
);
GO

/* =========================================================
   7. MOVIES
   ========================================================= */
CREATE TABLE Movies (
    movie_id INT PRIMARY KEY IDENTITY(1,1),
    title VARCHAR(255) NOT NULL,
    duration_minutes INT,
    genre VARCHAR(100),
    release_date DATE,
    rating VARCHAR(10),
    language VARCHAR(50)
);
GO

/* =========================================================
   8. SHOWS (NO RESERVED WORD ISSUE)
   ========================================================= */
CREATE TABLE Shows (
    show_id INT PRIMARY KEY IDENTITY(1,1),
    movie_id INT NOT NULL,
    screen_id INT NOT NULL,
    show_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    FOREIGN KEY (movie_id) REFERENCES Movies(movie_id),
    FOREIGN KEY (screen_id) REFERENCES Screens(screen_id)
);
GO

/* =========================================================
   9. BOOKINGS
   ========================================================= */
CREATE TABLE Bookings (
    booking_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    show_id INT NOT NULL,
    booking_time DATETIME DEFAULT GETDATE(),
    status VARCHAR(20) DEFAULT 'CONFIRMED',

    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (show_id) REFERENCES Shows(show_id)
);
GO

/* =========================================================
   10. BOOKED SEATS
   ========================================================= */
CREATE TABLE BookingSeats (
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,

    PRIMARY KEY (booking_id, seat_id),

    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id),
    FOREIGN KEY (seat_id) REFERENCES Seats(seat_id)
);
GO

/* =========================================================
   11. SEAT HOLDS (Concurrency control)
   ========================================================= */
CREATE TABLE SeatHolds (
    hold_id INT PRIMARY KEY IDENTITY(1,1),
    show_id INT NOT NULL,
    seat_id INT NOT NULL,
    user_id INT NOT NULL,
    hold_time DATETIME DEFAULT GETDATE(),

    UNIQUE(show_id, seat_id)
);
GO

/* =========================================================
   12. PAYMENTS (supports multiple payments per booking)
   ========================================================= */
CREATE TABLE Payments (
    payment_id INT PRIMARY KEY IDENTITY(1,1),
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50),
    payment_time DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);
GO

/* =========================================================
   13. CONCESSION ITEMS
   ========================================================= */
CREATE TABLE ConcessionItems (
    item_id INT PRIMARY KEY IDENTITY(1,1),
    item_name VARCHAR(150),
    price DECIMAL(10,2)
);
GO

/* =========================================================
   14. FOOD ORDERS
   ========================================================= */
CREATE TABLE FoodOrders (
    food_order_id INT PRIMARY KEY IDENTITY(1,1),
    booking_id INT NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0,

    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);
GO

/* =========================================================
   15. FOOD ORDER ITEMS (BCNF FIXED - NO PRICE STORAGE)
   ========================================================= */
CREATE TABLE FoodOrderItems (
    food_order_id INT,
    item_id INT,
    quantity INT NOT NULL,

    PRIMARY KEY (food_order_id, item_id),

    FOREIGN KEY (food_order_id) REFERENCES FoodOrders(food_order_id),
    FOREIGN KEY (item_id) REFERENCES ConcessionItems(item_id)
);
GO

/* =========================================================
   16. DISCOUNTS
   ========================================================= */
CREATE TABLE Discounts (
    discount_id INT PRIMARY KEY IDENTITY(1,1),
    code VARCHAR(50) UNIQUE,
    discount_type VARCHAR(20),
    discount_value DECIMAL(10,2),
    is_active BIT DEFAULT 1
);
GO

/* =========================================================
   17. BOOKING DISCOUNT
   ========================================================= */
CREATE TABLE BookingDiscounts (
    booking_id INT PRIMARY KEY,
    discount_id INT,
    discount_amount DECIMAL(10,2),

    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id),
    FOREIGN KEY (discount_id) REFERENCES Discounts(discount_id)
);
GO

/* =========================================================
   18. FEEDBACK
   ========================================================= */
CREATE TABLE Feedback (
    feedback_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    booking_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),

    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);
GO

/* =========================================================
   19. NOTIFICATIONS
   ========================================================= */
CREATE TABLE Notifications (
    notification_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    message VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

/* =========================================================
   20. CORE FUNCTION: TOTAL BOOKING AMOUNT
   ========================================================= */
CREATE FUNCTION fn_TotalBookingAmount(@booking_id INT)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @total DECIMAL(10,2);

    SELECT @total =
        SUM(st.price_modifier + ci.price)
    FROM BookingSeats bs
    JOIN Seats s ON bs.seat_id = s.seat_id
    JOIN SeatTypes st ON s.seat_type_id = st.seat_type_id
    JOIN FoodOrders fo ON fo.booking_id = @booking_id
    JOIN FoodOrderItems foi ON fo.food_order_id = foi.food_order_id
    JOIN ConcessionItems ci ON foi.item_id = ci.item_id
    WHERE bs.booking_id = @booking_id;

    RETURN ISNULL(@total,0);
END;
GO

/* =========================================================
   21. PROCEDURE: CREATE BOOKING
   ========================================================= */
CREATE PROCEDURE sp_CreateBooking
    @user_id INT,
    @show_id INT
AS
BEGIN
    INSERT INTO Bookings(user_id, show_id)
    VALUES (@user_id, @show_id);
END;
GO

/* =========================================================
   22. PROCEDURE: GET AVAILABLE SEATS
   ========================================================= */
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

/* =========================================================
   23. PROCEDURE: HOLD SEAT
   ========================================================= */
CREATE PROCEDURE sp_HoldSeat
    @user_id INT,
    @show_id INT,
    @seat_id INT
AS
BEGIN
    INSERT INTO SeatHolds(user_id, show_id, seat_id)
    VALUES (@user_id, @show_id, @seat_id);
END;
GO

/* =========================================================
   24. TRIGGER: UPDATE FOOD TOTAL
   ========================================================= */
CREATE TRIGGER trg_UpdateFoodTotal
ON FoodOrderItems
AFTER INSERT
AS
BEGIN
    UPDATE fo
    SET total_amount =
    (
        SELECT SUM(foi.quantity * ci.price)
        FROM FoodOrderItems foi
        JOIN ConcessionItems ci ON foi.item_id = ci.item_id
        WHERE foi.food_order_id = fo.food_order_id
    )
    FROM FoodOrders fo
    JOIN inserted i ON fo.food_order_id = i.food_order_id;
END;
GO

/* =========================================================
   25. ADMIN REPORT VIEW
   ========================================================= */
CREATE VIEW vw_AdminRevenue AS
SELECT
    m.title,
    COUNT(b.booking_id) AS total_bookings,
    SUM(dbo.fn_TotalBookingAmount(b.booking_id)) AS revenue
FROM Bookings b
JOIN Shows s ON b.show_id = s.show_id
JOIN Movies m ON s.movie_id = m.movie_id
GROUP BY m.title;
GO


/* =========================================================
   Insert Test Data
   ========================================================= */
 USE CinemaBookingDB;
GO
INSERT INTO Movies (title, duration_minutes, genre, release_date, rating, language)
VALUES 
('Avengers', 120, 'Action', '2020-01-01', 'PG-13', 'English'),
('Inception', 140, 'Sci-Fi', '2019-05-10', 'PG-13', 'English');




USE CinemaBookingDB;
GO

/* ===============================
   CINEMAS
   =============================== */
INSERT INTO Cinemas (name, location, contact)
VALUES
('Grand Cinema', 'Downtown, Lahore', '111-222-333'),
('Galaxy Cinemas', 'Mall Road, City B', '444-555-666');
GO

/* ===============================
   SCREEN TYPES
   =============================== */
INSERT INTO ScreenTypes (type_name, base_price)
VALUES
('Standard', 1000),
('IMAX', 1500),
('3D', 3000);
GO

/* ===============================
   SCREENS
   =============================== */
INSERT INTO Screens (cinema_id, screen_type_id)
VALUES
(1, 1),
(1, 2),
(2, 1),
(2, 3);
GO

/* ===============================
   SEAT TYPES
   =============================== */
INSERT INTO SeatTypes (category, price_modifier)
VALUES
('Regular', 500),
('Premium', 800),
('VIP', 1000);
GO

/* ===============================
   SEATS
   =============================== */
INSERT INTO Seats (screen_id, seat_type_id, seat_no, row_no)
VALUES
(1, 1, 'A1', 'A'),
(1, 1, 'A2', 'A'),
(1, 2, 'B1', 'B'),
(2, 3, 'C1', 'C'),
(2, 1, 'A1', 'A'),
(2, 1, 'A2', 'A'),
(3, 1, 'A1', 'A'),
(3, 2, 'B1', 'B');
GO

/* ===============================
   MOVIES
   =============================== */
INSERT INTO Movies (title, duration_minutes, genre, release_date, rating, language)
VALUES
('Mission Impossible – Dead Reckoning', 163, 'Action', '2023-07-12', 'PG-13', 'English'),
('Oppenheimer', 180, 'Drama', '2023-07-21', 'R', 'English'),
('Jawan', 169, 'Action', '2023-09-07', 'UA', 'Hindi'),
('Pathaan', 146, 'Action', '2023-01-25', 'UA', 'Hindi'),
('The Legend of Maula Jatt', 153, 'Action', '2022-10-13', 'PG', 'Urdu'),
('Teefa in Trouble', 155, 'Action/Comedy', '2018-07-20', 'PG', 'Urdu'),
('London Nahi Jaunga', 140, 'Romance', '2022-07-10', 'PG', 'Urdu');
GO

/* ===============================
   SHOWS
   =============================== */
INSERT INTO Shows (movie_id, screen_id, show_date, start_time, end_time)
VALUES
(1, 1, '2026-03-01', '14:00', '16:45'),
(2, 2, '2026-03-01', '18:00', '21:00'),
(3, 3, '2026-03-01', '15:00', '17:50'),
(5, 1, '2026-03-02', '20:00', '22:30');
GO

/* ===============================
   USERS (needed for FK consistency if you test bookings)
   =============================== */
INSERT INTO Users (full_name, email, phone, user_role)
VALUES
('Ali Khan', 'ali@gmail.com', '03001234567', 'Customer'),
('Admin User', 'admin@gmail.com', '03007654321', 'Admin');
GO



USE CinemaBookingDB;
GO

IF OBJECT_ID('BookingSeats', 'U') IS NULL
BEGIN
    CREATE TABLE BookingSeats (
        booking_id INT NOT NULL,
        seat_id INT NOT NULL,

        PRIMARY KEY (booking_id, seat_id),

        FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id),
        FOREIGN KEY (seat_id) REFERENCES Seats(seat_id)
    );
END
GO



/*
SELECT DB_NAME() AS current_db;
SELECT USER_NAME() AS curr_user;
SELECT name 
FROM sys.tables;
*/