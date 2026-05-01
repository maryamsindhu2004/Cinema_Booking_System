/* ===============================================================
   THEATRO MASTER DATABASE SETUP - ALL FEATURES INCLUDED
   =============================================================== */

-- 1. DROP EXISTING TABLES (IN CORRECT ORDER)
DROP TABLE IF EXISTS ShowSeatAvailability;
DROP TABLE IF EXISTS Feedback;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS BookingSeat;
DROP TABLE IF EXISTS Booking;
DROP TABLE IF EXISTS FoodOrderDetail;
DROP TABLE IF EXISTS FoodOrder;
DROP TABLE IF EXISTS Item;
DROP TABLE IF EXISTS ShowTable;
DROP TABLE IF EXISTS MovieGenre;
DROP TABLE IF EXISTS Genre;
DROP TABLE IF EXISTS Movie;
DROP TABLE IF EXISTS Seat;
DROP TABLE IF EXISTS SeatType;
DROP TABLE IF EXISTS Screen;
DROP TABLE IF EXISTS ScreenType;
DROP TABLE IF EXISTS Cinema;
DROP TABLE IF EXISTS Discount;
DROP TABLE IF EXISTS Users;
GO

-- 2. CREATE CORE TABLES
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(200) UNIQUE NOT NULL,
    password_hash NVARCHAR(510) NOT NULL,
    phoneNo NVARCHAR(40),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Cinema (
    cinemaId INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(MAX) NOT NULL,
    contact VARCHAR(50),
    isActive BIT DEFAULT 1
);

CREATE TABLE ScreenType (
    screenTypeId INT PRIMARY KEY IDENTITY(1,1),
    typeName VARCHAR(100) NOT NULL,
    priceScreen DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE Screen (
    screenId INT PRIMARY KEY IDENTITY(1,1),
    cinemaId INT NOT NULL,
    screenTypeId INT NOT NULL,
    totalSeats INT DEFAULT 50,
    isActive BIT DEFAULT 1,
    FOREIGN KEY (cinemaId) REFERENCES Cinema(cinemaId),
    FOREIGN KEY (screenTypeId) REFERENCES ScreenType(screenTypeId)
);

CREATE TABLE SeatType (
    seatTypeId INT PRIMARY KEY IDENTITY(1,1),
    category VARCHAR(100) NOT NULL,
    priceSeat DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE Seat (
    seatId INT PRIMARY KEY IDENTITY(1,1),
    screenId INT NOT NULL,
    seatTypeId INT NOT NULL,
    seatNo VARCHAR(10) NOT NULL,
    rowNo VARCHAR(5),
    isActive BIT DEFAULT 1,
    isWheelchairAllow BIT DEFAULT 0,
    FOREIGN KEY (screenId) REFERENCES Screen(screenId),
    FOREIGN KEY (seatTypeId) REFERENCES SeatType(seatTypeId)
);

CREATE TABLE Movie (
    movieId INT PRIMARY KEY IDENTITY(1,1),
    title VARCHAR(255) NOT NULL,
    duration INT,
    releaseDate DATE,
    rating VARCHAR(10),
    language VARCHAR(50),
    description VARCHAR(MAX)
);

CREATE TABLE ShowTable (
    showId INT PRIMARY KEY IDENTITY(1,1),
    movieId INT NOT NULL,
    screenId INT NOT NULL,
    showDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    isCancelled BIT DEFAULT 0,
    FOREIGN KEY (movieId) REFERENCES Movie(movieId),
    FOREIGN KEY (screenId) REFERENCES Screen(screenId)
);

CREATE TABLE Booking (
    bookingId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    showId INT NOT NULL,
    bookingDate DATETIME DEFAULT GETDATE(),
    bookingStatus BIT DEFAULT 1,
    totalAmount DECIMAL(10,2) DEFAULT 0,
    paymentStatus VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (showId) REFERENCES ShowTable(showId)
);

CREATE TABLE BookingSeat (
    bookingId INT NOT NULL,
    seatId INT NOT NULL,
    priceAtBooking DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (bookingId, seatId),
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId),
    FOREIGN KEY (seatId) REFERENCES Seat(seatId)
);

CREATE TABLE ShowSeatAvailability (
    showId INT NOT NULL,
    seatId INT NOT NULL,
    isBooked BIT DEFAULT 0,
    bookedAt DATETIME NULL,
    PRIMARY KEY (showId, seatId),
    FOREIGN KEY (showId) REFERENCES ShowTable(showId),
    FOREIGN KEY (seatId) REFERENCES Seat(seatId)
);

CREATE TABLE Feedback (
    feedbackId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    bookingId INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments VARCHAR(MAX),
    feedbackDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId)
);

GO

-- 3. SEED DATA
INSERT INTO Cinema (name, location) VALUES ('Cineplex Karachi', 'Tariq Road'), ('Nueplex Lahore', 'DHA Phase 6');
INSERT INTO ScreenType (typeName, priceScreen) VALUES ('Standard', 500), ('IMAX', 1000), ('VIP', 1500);
INSERT INTO Screen (cinemaId, screenTypeId, totalSeats) VALUES (1, 1, 50), (1, 2, 80), (2, 3, 40);
INSERT INTO SeatType (category, priceSeat) VALUES ('Classic', 300), ('Premium', 600);

-- Populate Seats (Row A is Wheelchair, Last rows are Premium)
DECLARE @scId INT = 1;
WHILE @scId <= 3
BEGIN
    DECLARE @total INT = (SELECT totalSeats FROM Screen WHERE screenId = @scId);
    DECLARE @j INT = 1;
    WHILE @j <= @total
    BEGIN
        DECLARE @row CHAR(1) = CHAR(65 + ((@j-1)/10));
        INSERT INTO Seat (screenId, seatTypeId, seatNo, rowNo, isWheelchairAllow)
        VALUES (@scId, CASE WHEN @row >= 'E' THEN 2 ELSE 1 END, CAST(@j AS VARCHAR), @row, CASE WHEN @row = 'A' THEN 1 ELSE 0 END);
        SET @j = @j + 1;
    END
    SET @scId = @scId + 1;
END

INSERT INTO Movie (title, duration, rating, language, description) 
VALUES ('Mission Impossible', 163, 'PG-13', 'English', 'Epic action movie.'), ('PK', 153, 'PG-13', 'Hindi', 'Thought provoking story.');

-- Shows for the next 4 days
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime)
SELECT m.movieId, s.screenId, CAST(DATEADD(day, d.d, GETDATE()) AS DATE), t.st, t.et
FROM Movie m, Screen s, (VALUES (0),(1),(2),(3)) d(d), (VALUES ('10:00','12:30'), ('14:00','16:30'), ('19:00','21:30')) t(st, et);

INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0 FROM ShowTable s JOIN Seat se ON se.screenId = s.screenId;
GO

-- 4. PROCEDURES
CREATE OR ALTER PROCEDURE sp_BookTicket
    @userId INT, @showId INT, @seatIds VARCHAR(MAX), @discountCode VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @bookingId INT;
        INSERT INTO Booking (userId, showId, totalAmount, paymentStatus) VALUES (@userId, @showId, 0, 'Pending');
        SET @bookingId = SCOPE_IDENTITY();
        
        DECLARE @total DECIMAL(10,2) = 0;
        DECLARE @SeatTable TABLE (id INT);
        INSERT INTO @SeatTable SELECT value FROM STRING_SPLIT(@seatIds, ',');

        INSERT INTO BookingSeat (bookingId, seatId, priceAtBooking)
        SELECT @bookingId, s.seatId, st.priceSeat FROM @SeatTable t JOIN Seat s ON t.id = s.seatId JOIN SeatType st ON s.seatTypeId = st.seatTypeId;

        SELECT @total = SUM(st.priceSeat) FROM @SeatTable t JOIN Seat s ON t.id = s.seatId JOIN SeatType st ON s.seatTypeId = st.seatTypeId;
        SET @total = @total + (SELECT st.priceScreen FROM ShowTable s JOIN Screen sc ON s.screenId = sc.screenId JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId WHERE s.showId = @showId);
        
        UPDATE Booking SET totalAmount = @total WHERE bookingId = @bookingId;
        UPDATE ShowSeatAvailability SET isBooked = 1 WHERE showId = @showId AND seatId IN (SELECT id FROM @SeatTable);
        
        COMMIT;
        SELECT @bookingId AS BookingID, @total AS TotalAmount, 'Success' AS Status;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SELECT ERROR_MESSAGE() AS ErrorMessage, 'Failed' AS Status;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AddFeedback @userId INT, @bookingId INT, @rating INT, @comments VARCHAR(MAX) AS
BEGIN
    INSERT INTO Feedback (userId, bookingId, rating, comments) VALUES (@userId, @bookingId, @rating, @comments);
END;
GO

-- 5. VIEWS
CREATE OR ALTER VIEW vw_UserBookingHistory AS
SELECT b.userId, b.bookingId, b.bookingDate, b.totalAmount, b.paymentStatus, m.title AS MovieTitle, c.name AS CinemaName, s.showDate, s.startTime, 
(SELECT COUNT(*) FROM BookingSeat bs WHERE bs.bookingId = b.bookingId) AS SeatCount,
(SELECT STRING_AGG(se.seatNo, ', ') FROM BookingSeat bs JOIN Seat se ON bs.seatId = se.seatId WHERE bs.bookingId = b.bookingId) AS Seats
FROM Booking b JOIN ShowTable s ON b.showId = s.showId JOIN Movie m ON s.movieId = m.movieId JOIN Screen sc ON s.screenId = sc.screenId JOIN Cinema c ON sc.cinemaId = c.cinemaId;
GO

PRINT 'Master Database setup completed successfully!';
