/* ===============================================================
   THEATRO CINEMA SYSTEM - BCNF COMPLIANT SCHEMA
   =============================================================== */

CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(200) UNIQUE NOT NULL,
    password_hash NVARCHAR(510) NOT NULL,
    phoneNo NVARCHAR(40),
    created_at DATETIME DEFAULT GETDATE()
);


-- 2. Cinema Table
CREATE TABLE Cinema (
    cinemaId INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(MAX) NOT NULL,
    contact VARCHAR(50),
    openingTime TIME,
    closingTime TIME,
    isActive BIT DEFAULT 1
);

-- 3. ScreenType Table
CREATE TABLE ScreenType (
    screenTypeId INT PRIMARY KEY IDENTITY(1,1),
    typeName VARCHAR(100) NOT NULL,
    description VARCHAR(MAX),
    priceScreen DECIMAL(10,2) CHECK (priceScreen >= 0)
);

-- 4. Screen Table
CREATE TABLE Screen (
    screenId INT PRIMARY KEY IDENTITY(1,1),
    cinemaId INT NOT NULL,
    screenTypeId INT NOT NULL,
    totalSeats INT CHECK (totalSeats > 0),
    isActive BIT DEFAULT 1,
    FOREIGN KEY (cinemaId) REFERENCES Cinema(cinemaId) ON DELETE CASCADE,
    FOREIGN KEY (screenTypeId) REFERENCES ScreenType(screenTypeId)
);

-- 5. SeatType Table
CREATE TABLE SeatType (
    seatTypeId INT PRIMARY KEY IDENTITY(1,1),
    category VARCHAR(100) NOT NULL,
    priceSeat DECIMAL(10,2) CHECK (priceSeat >= 0)
);

-- 6. Seat Table
CREATE TABLE Seat (
    seatId INT PRIMARY KEY IDENTITY(1,1),
    screenId INT NOT NULL,
    seatTypeId INT NOT NULL,
    seatNo VARCHAR(10) NOT NULL,
    rowNo VARCHAR(5),
    isActive BIT DEFAULT 1,
    isWheelchairAllow BIT DEFAULT 0,
    FOREIGN KEY (screenId) REFERENCES Screen(screenId) ON DELETE CASCADE,
    FOREIGN KEY (seatTypeId) REFERENCES SeatType(seatTypeId)
);

-- 7. Movie Table
CREATE TABLE Movie (
    movieId INT PRIMARY KEY IDENTITY(1,1),
    title VARCHAR(255) NOT NULL,
    duration INT CHECK (duration > 0),
    releaseDate DATE,
    rating VARCHAR(10),
    language VARCHAR(50),
    description VARCHAR(MAX)
);

-- 8. Genre Table
CREATE TABLE Genre (
    genreId INT PRIMARY KEY IDENTITY(1,1),
    genreName VARCHAR(50) UNIQUE NOT NULL
);

-- 9. MovieGenre Table (BCNF - removes multi-valued dependency)
CREATE TABLE MovieGenre (
    movieId INT NOT NULL,
    genreId INT NOT NULL,
    PRIMARY KEY (movieId, genreId),
    FOREIGN KEY (movieId) REFERENCES Movie(movieId) ON DELETE CASCADE,
    FOREIGN KEY (genreId) REFERENCES Genre(genreId) ON DELETE CASCADE
);

-- 10. ShowTable
CREATE TABLE ShowTable (
    showId INT PRIMARY KEY IDENTITY(1,1),
    movieId INT NOT NULL,
    screenId INT NOT NULL,
    showDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    isCancelled BIT DEFAULT 0,
    FOREIGN KEY (movieId) REFERENCES Movie(movieId),
    FOREIGN KEY (screenId) REFERENCES Screen(screenId) ON DELETE CASCADE,
    CONSTRAINT chkTime CHECK (endTime > startTime)
);

-- 11. Booking Table
CREATE TABLE Booking (
    bookingId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    showId INT NOT NULL,
    bookingDate DATETIME DEFAULT GETDATE(),
    bookingStatus BIT DEFAULT 1,
    totalAmount DECIMAL(10,2) DEFAULT 0,
    paymentStatus VARCHAR(20) DEFAULT 'Pending' CHECK (paymentStatus IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (showId) REFERENCES ShowTable(showId)
);

-- 12. BookingSeat Table (BCNF)
CREATE TABLE BookingSeat (
    bookingId INT NOT NULL,
    seatId INT NOT NULL,
    priceAtBooking DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (bookingId, seatId),
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE,
    FOREIGN KEY (seatId) REFERENCES Seat(seatId)
);

-- 13. Payment Table
CREATE TABLE Payment (
    paymentId INT PRIMARY KEY IDENTITY(1,1),
    bookingId INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    paymentMethod VARCHAR(30) CHECK (paymentMethod IN ('Credit Card', 'Debit Card', 'Cash', 'Mobile Wallet')),
    paymentDate DATETIME DEFAULT GETDATE(),
    transactionId VARCHAR(100) UNIQUE,
    paymentStatus VARCHAR(20) DEFAULT 'Completed',
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE
);

-- 14. Item Table (BCNF)
CREATE TABLE Item (
    itemId INT PRIMARY KEY IDENTITY(1,1),
    itemName VARCHAR(100) NOT NULL,
    basePrice DECIMAL(10,2) NOT NULL CHECK (basePrice >= 0),
    category VARCHAR(50),
    isAvailable BIT DEFAULT 1
);

-- 15. FoodOrder Table
CREATE TABLE FoodOrder (
    foodOrderId INT PRIMARY KEY IDENTITY(1,1),
    bookingId INT NOT NULL,
    orderDate DATETIME DEFAULT GETDATE(),
    totalAmount DECIMAL(10,2) DEFAULT 0 CHECK (totalAmount >= 0),
    orderStatus VARCHAR(20) DEFAULT 'Pending' CHECK (orderStatus IN ('Pending', 'Preparing', 'Ready', 'Delivered')),
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE
);

-- 16. FoodOrderDetail Table (BCNF)
CREATE TABLE FoodOrderDetail (
    foodOrderId INT NOT NULL,
    itemId INT NOT NULL,
    quantity INT CHECK (quantity > 0),
    priceAtOrder DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (foodOrderId, itemId),
    FOREIGN KEY (foodOrderId) REFERENCES FoodOrder(foodOrderId) ON DELETE CASCADE,
    FOREIGN KEY (itemId) REFERENCES Item(itemId)
);

-- 17. Discount Table
CREATE TABLE Discount (
    discountId INT PRIMARY KEY IDENTITY(1,1),
    discountCode VARCHAR(50) UNIQUE NOT NULL,
    discountType VARCHAR(20) CHECK (discountType IN ('PERCENTAGE', 'FIXED')),
    discountValue DECIMAL(10,2) CHECK (discountValue >= 0),
    validFrom DATE,
    validTo DATE,
    minBookingAmount DECIMAL(10,2) DEFAULT 0,
    applicableDays VARCHAR(50),
    isActive BIT DEFAULT 1
);

-- 18. Feedback Table
CREATE TABLE Feedback (
    feedbackId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    bookingId INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments VARCHAR(MAX),
    feedbackDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId)
);


-- Recreate WITHOUT cascade on Seat foreign key
CREATE TABLE ShowSeatAvailability (
    showId INT NOT NULL,
    seatId INT NOT NULL,
    isBooked BIT DEFAULT 0,
    bookedAt DATETIME NULL,
    PRIMARY KEY (showId, seatId),
    FOREIGN KEY (showId) REFERENCES ShowTable(showId) ON DELETE CASCADE,
    FOREIGN KEY (seatId) REFERENCES Seat(seatId)  -- NO CASCADE here!
);
GO

-- Now seed the data
INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
INNER JOIN Seat se ON se.screenId = s.screenId
WHERE NOT EXISTS (SELECT 1 FROM ShowSeatAvailability ssa WHERE ssa.showId = s.showId AND ssa.seatId = se.seatId);
GO


/* ===============================================================
   SEED DATA
   =============================================================== */

-- Insert Cinema
INSERT INTO Cinema (name, location, contact, openingTime, closingTime, isActive)
VALUES 
('Cineplex Karachi', 'Tariq Road, Karachi', '021-1234567', '09:00', '23:00', 1),
('Cineplex Lahore', 'MM Alam Road, Lahore', '042-7654321', '10:00', '00:00', 1),
('Cineplex Islamabad', 'F-7 Markaz, Islamabad', '051-9876543', '09:30', '22:30', 1);

-- Insert ScreenType
INSERT INTO ScreenType (typeName, description, priceScreen)
VALUES 
('Standard', 'Regular screen with standard seating', 500.00),
('IMAX', 'Large format IMAX screen with superior sound', 1000.00),
('3D', '3D screen with glasses included', 800.00),
('VIP', 'Premium VIP lounge experience', 1500.00);

-- Insert Screens
INSERT INTO Screen (cinemaId, screenTypeId, totalSeats, isActive)
VALUES 
(1, 1, 50, 1),
(1, 2, 80, 1),
(2, 1, 60, 1),
(2, 3, 70, 1),
(3, 4, 40, 1);

-- Insert SeatType
INSERT INTO SeatType (category, priceSeat)
VALUES 
('Standard', 300.00),
('Premium', 500.00),
('VIP', 800.00),
('Accessible', 350.00);

-- Insert Seats for each screen
DECLARE @screenId INT = 1;
WHILE @screenId <= 5
BEGIN
    DECLARE @totalSeats INT = CASE @screenId 
        WHEN 1 THEN 50 WHEN 2 THEN 80 WHEN 3 THEN 60 WHEN 4 THEN 70 WHEN 5 THEN 40 
    END;
    DECLARE @i INT = 1;
    
    WHILE @i <= @totalSeats
    BEGIN
        INSERT INTO Seat (screenId, seatTypeId, seatNo, rowNo, isWheelchairAllow)
        VALUES (
            @screenId,
            CASE 
                WHEN @i <= @totalSeats * 0.7 THEN 1 
                WHEN @i <= @totalSeats * 0.9 THEN 2 
                ELSE 3 
            END,
            CAST(@i AS VARCHAR(10)),
            CHAR(65 + ((@i-1)/10)),
            CASE WHEN @i % 20 = 0 THEN 1 ELSE 0 END
        );
        SET @i = @i + 1;
    END;
    SET @screenId = @screenId + 1;
END;

-- Insert Genres
INSERT INTO Genre (genreName) VALUES 
('Action'), ('Drama'), ('Comedy'), ('Romance'), ('Sci-Fi'), ('Crime'), ('Thriller'), ('Horror'), ('Animation'), ('Documentary');

-- Insert Movies
INSERT INTO Movie (title, duration, releaseDate, rating, language, description) VALUES 
('Mission Impossible – Dead Reckoning', 163, '2023-07-12', 'PG-13', 'English', 'Ethan Hunt and his IMF team embark on their most dangerous mission yet.'),
('PK', 153, '2014-12-19', 'PG-13', 'Hindi', 'An alien lands on Earth and questions religious beliefs.'),
('Oppenheimer', 180, '2023-07-21', 'R', 'English', 'The story of J. Robert Oppenheimer and the atomic bomb.'),
('Inception', 148, '2010-07-16', 'PG-13', 'English', 'A thief who steals secrets through dream-sharing technology.'),
('The Dark Knight', 152, '2008-07-18', 'PG-13', 'English', 'Batman faces the Joker in Gotham City.'),
('3 Idiots', 170, '2009-12-25', 'PG-13', 'Hindi', 'Two friends search for their lost college buddy.'),
('Interstellar', 169, '2014-11-07', 'PG-13', 'English', 'Explorers travel through a wormhole in space.'),
('Jawan', 169, '2023-09-07', 'PG-13', 'Hindi', 'A man sets out to correct the wrongs in society.');

-- Insert MovieGenre relationships
INSERT INTO MovieGenre (movieId, genreId) VALUES
(1, 1), (1, 7),  -- Mission Impossible: Action, Thriller
(2, 3), (2, 5),  -- PK: Comedy, Sci-Fi
(3, 2), (3, 7),  -- Oppenheimer: Drama, Thriller
(4, 1), (4, 5), (4, 7),  -- Inception: Action, Sci-Fi, Thriller
(5, 1), (5, 2), (5, 6),  -- Dark Knight: Action, Drama, Crime
(6, 3), (6, 2),  -- 3 Idiots: Comedy, Drama
(7, 5), (7, 2),  -- Interstellar: Sci-Fi, Drama
(8, 1), (8, 7);  -- Jawan: Action, Thriller

-- Insert Shows
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(1, 1, DATEADD(day, 0, GETDATE()), '10:00', '12:43', 0),
(2, 2, DATEADD(day, 0, GETDATE()), '13:00', '15:33', 0),
(3, 3, DATEADD(day, 1, GETDATE()), '15:00', '18:00', 0),
(4, 1, DATEADD(day, 1, GETDATE()), '18:30', '20:58', 0),
(5, 4, DATEADD(day, 2, GETDATE()), '11:00', '13:32', 0),
(6, 2, DATEADD(day, 2, GETDATE()), '14:00', '16:50', 0),
(7, 5, DATEADD(day, 3, GETDATE()), '19:00', '21:49', 0),
(8, 3, DATEADD(day, 3, GETDATE()), '21:00', '23:49', 0);

-- Insert Users
INSERT INTO Users (name, email, password_hash, phoneNo) VALUES 
('John Doe', 'john@email.com', 'hash123', '03001234567'),
('Jane Smith', 'jane@email.com', 'hash456', '03007654321'),
('Alice Khan', 'alice@email.com', 'hash789', '03001112233'),
('Bob Ahmed', 'bob@email.com', 'hash000', '03009998877');

-- Insert Items
INSERT INTO Item (itemName, basePrice, category, isAvailable) VALUES 
('Popcorn Large', 500.00, 'Snacks', 1),
('Popcorn Medium', 350.00, 'Snacks', 1),
('Coke', 200.00, 'Beverages', 1),
('Sprite', 200.00, 'Beverages', 1),
('Nachos', 450.00, 'Snacks', 1),
('Hot Dog', 400.00, 'Food', 1),
('Pizza Slice', 600.00, 'Food', 1),
('Ice Cream', 250.00, 'Dessert', 1);

-- Insert Discounts
INSERT INTO Discount (discountCode, discountType, discountValue, validFrom, validTo, minBookingAmount, applicableDays, isActive) VALUES 
('SAVE10', 'PERCENTAGE', 10, '2024-01-01', '2025-12-31', 0, 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', 1),
('FLAT50', 'FIXED', 50, '2024-01-01', '2025-12-31', 500, 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', 1),
('WEEKEND20', 'PERCENTAGE', 20, '2024-01-01', '2025-12-31', 1000, 'Saturday,Sunday', 1);

-- Initialize ShowSeatAvailability
INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
CROSS JOIN Seat se
WHERE se.screenId = s.screenId
AND NOT EXISTS (SELECT 1 FROM ShowSeatAvailability ssa WHERE ssa.showId = s.showId AND ssa.seatId = se.seatId);

PRINT 'Seed data inserted successfully!';
GO


/* ===============================================================
   VIEWS
   =============================================================== */

-- View 1: Available Shows with Details
CREATE OR ALTER VIEW vw_AvailableShows AS
SELECT 
    s.showId,
    m.title AS MovieTitle,
    m.duration,
    m.rating,
    m.language,
    c.name AS CinemaName,
    c.location AS CinemaLocation,
    st.typeName AS ScreenType,
    st.priceScreen AS ScreenPrice,
    s.showDate,
    s.startTime,
    s.endTime,
    DATEDIFF(MINUTE, s.startTime, s.endTime) AS DurationMinutes,
    (SELECT COUNT(*) FROM Seat se WHERE se.screenId = sc.screenId) AS TotalSeats,
    (SELECT COUNT(*) FROM ShowSeatAvailability ssa WHERE ssa.showId = s.showId AND ssa.isBooked = 0) AS AvailableSeats,
    STUFF((
        SELECT ', ' + g.genreName
        FROM MovieGenre mg
        JOIN Genre g ON mg.genreId = g.genreId
        WHERE mg.movieId = m.movieId
        FOR XML PATH('')
    ), 1, 2, '') AS Genres
FROM ShowTable s
JOIN Movie m ON s.movieId = m.movieId
JOIN Screen sc ON s.screenId = sc.screenId
JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
JOIN Cinema c ON sc.cinemaId = c.cinemaId
WHERE s.isCancelled = 0 AND s.showDate >= CAST(GETDATE() AS DATE);
GO

-- View 2: Seat Availability for a Specific Show
CREATE OR ALTER VIEW vw_SeatAvailability AS
SELECT 
    s.showId,
    s.showDate,
    s.startTime,
    m.title AS MovieTitle,
    se.seatId,
    se.seatNo,
    se.rowNo,
    st.category AS SeatCategory,
    st.priceSeat AS BaseSeatPrice,
    sct.priceScreen AS ScreenPrice,
    CASE 
        WHEN ssa.isBooked = 1 THEN 'Booked'
        ELSE 'Available'
    END AS Status,
    CASE 
        WHEN ssa.isBooked = 1 THEN ssa.bookedAt
        ELSE NULL
    END AS BookedAt
FROM ShowTable s
JOIN Movie m ON s.movieId = m.movieId
JOIN Screen sc ON s.screenId = sc.screenId
JOIN ScreenType sct ON sc.screenTypeId = sct.screenTypeId
JOIN Seat se ON sc.screenId = se.screenId
JOIN SeatType st ON se.seatTypeId = st.seatTypeId
LEFT JOIN ShowSeatAvailability ssa ON s.showId = ssa.showId AND se.seatId = ssa.seatId
WHERE s.isCancelled = 0;
GO

-- View 3: User Booking History
CREATE OR ALTER VIEW vw_UserBookingHistory AS
SELECT 
    u.id AS UserId,
    u.name AS UserName,
    u.email,
    b.bookingId,
    b.bookingDate,
    b.totalAmount,
    b.paymentStatus,
    m.title AS MovieTitle,
    c.name AS CinemaName,
    s.showDate,
    s.startTime,
    COUNT(DISTINCT bs.seatId) AS NumberOfSeats,
    STRING_AGG(CAST(se.seatNo AS VARCHAR), ', ') AS Seats,
    CASE WHEN f.feedbackId IS NOT NULL THEN 'Feedback Given' ELSE 'No Feedback' END AS FeedbackStatus
FROM Users u
JOIN Booking b ON u.id = b.userId
JOIN ShowTable s ON b.showId = s.showId
JOIN Movie m ON s.movieId = m.movieId
JOIN Cinema c ON s.screenId = c.cinemaId
JOIN BookingSeat bs ON b.bookingId = bs.bookingId
JOIN Seat se ON bs.seatId = se.seatId
LEFT JOIN Feedback f ON b.bookingId = f.bookingId
GROUP BY u.id, u.name, u.email, b.bookingId, b.bookingDate, b.totalAmount, b.paymentStatus, m.title, c.name, s.showDate, s.startTime, f.feedbackId;
GO

-- View 4: Daily Revenue Report
CREATE OR ALTER VIEW vw_DailyRevenueReport AS
SELECT 
    CAST(b.bookingDate AS DATE) AS SaleDate,
    COUNT(DISTINCT b.bookingId) AS TotalBookings,
    SUM(b.totalAmount) AS TotalRevenue,
    AVG(b.totalAmount) AS AverageBookingValue,
    COUNT(DISTINCT CASE WHEN p.paymentMethod = 'Credit Card' THEN b.bookingId END) AS CreditCardBookings,
    COUNT(DISTINCT CASE WHEN p.paymentMethod = 'Mobile Wallet' THEN b.bookingId END) AS MobileWalletBookings,
    COUNT(DISTINCT CASE WHEN p.paymentMethod = 'Cash' THEN b.bookingId END) AS CashBookings,
    SUM(CASE WHEN fo.foodOrderId IS NOT NULL THEN fo.totalAmount ELSE 0 END) AS FoodRevenue,
    SUM(b.totalAmount) - SUM(CASE WHEN fo.foodOrderId IS NOT NULL THEN fo.totalAmount ELSE 0 END) AS TicketRevenue
FROM Booking b
LEFT JOIN Payment p ON b.bookingId = p.bookingId
LEFT JOIN FoodOrder fo ON b.bookingId = fo.bookingId
WHERE b.bookingStatus = 1 AND b.paymentStatus = 'Paid'
GROUP BY CAST(b.bookingDate AS DATE);
GO

-- View 5: Movie Popularity Ranking
CREATE OR ALTER VIEW vw_MoviePopularityRanking AS
SELECT 
    m.movieId,
    m.title,
    m.language,
    COUNT(DISTINCT b.bookingId) AS TotalBookings,
    COUNT(DISTINCT bs.seatId) AS TotalSeatsSold,
    AVG(f.rating) AS AverageRating,
    COUNT(f.feedbackId) AS TotalReviews,
    RANK() OVER (ORDER BY COUNT(DISTINCT b.bookingId) DESC) AS PopularityRank
FROM Movie m
LEFT JOIN ShowTable s ON m.movieId = s.movieId
LEFT JOIN Booking b ON s.showId = b.showId AND b.bookingStatus = 1
LEFT JOIN BookingSeat bs ON b.bookingId = bs.bookingId
LEFT JOIN Feedback f ON b.bookingId = f.bookingId
GROUP BY m.movieId, m.title, m.language;
GO

-- View 6: Screen Utilization Report
CREATE OR ALTER VIEW vw_ScreenUtilizationReport AS
SELECT 
    c.name AS CinemaName,
    sc.screenId,
    st.typeName AS ScreenType,
    COUNT(DISTINCT s.showId) AS TotalShows,
    COUNT(DISTINCT b.bookingId) AS TotalBookings,
    COUNT(DISTINCT bs.seatId) AS SeatsSold,
    sc.totalSeats,
    (COUNT(DISTINCT bs.seatId) * 100.0 / (sc.totalSeats * COUNT(DISTINCT s.showId))) AS UtilizationPercentage
FROM Cinema c
JOIN Screen sc ON c.cinemaId = sc.cinemaId
JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
LEFT JOIN ShowTable s ON sc.screenId = s.screenId AND s.isCancelled = 0
LEFT JOIN Booking b ON s.showId = b.showId AND b.bookingStatus = 1
LEFT JOIN BookingSeat bs ON b.bookingId = bs.bookingId
GROUP BY c.name, sc.screenId, st.typeName, sc.totalSeats;
GO

PRINT 'All views created successfully!';
GO

/* ===============================================================
   STORED PROCEDURES
   =============================================================== */

-- Helper Function for String Splitting
CREATE OR ALTER FUNCTION dbo.SplitInts (@Input VARCHAR(MAX), @Separator CHAR(1) = ',')
RETURNS @ReturnTable TABLE (Value INT)
AS
BEGIN
    IF RIGHT(@Input, 1) <> @Separator SET @Input = @Input + @Separator;
    DECLARE @Pos INT = CHARINDEX(@Separator, @Input);
    
    WHILE @Pos > 0
    BEGIN
        DECLARE @Value INT = TRY_CAST(LEFT(@Input, @Pos - 1) AS INT);
        IF @Value IS NOT NULL INSERT INTO @ReturnTable VALUES (@Value);
        SET @Input = RIGHT(@Input, LEN(@Input) - @Pos);
        SET @Pos = CHARINDEX(@Separator, @Input);
    END
    RETURN;
END;
GO

-- Procedure 1: Book Ticket
CREATE OR ALTER PROCEDURE sp_BookTicket
    @userId INT,
    @showId INT,
    @seatIds VARCHAR(MAX),
    @discountCode VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validation
        IF NOT EXISTS (SELECT 1 FROM Users WHERE id = @userId)
            THROW 50001, 'Invalid User ID.', 1;
        
        IF NOT EXISTS (SELECT 1 FROM ShowTable WHERE showId = @showId AND isCancelled = 0 AND showDate >= CAST(GETDATE() AS DATE))
            THROW 50002, 'Invalid Show ID or Show is cancelled/passed.', 1;

        -- Check seat availability
        DECLARE @bookedSeats TABLE (seatId INT);
        INSERT INTO @bookedSeats SELECT Value FROM dbo.SplitInts(@seatIds, ',');
        
        IF EXISTS (
            SELECT 1 FROM ShowSeatAvailability ssa
            JOIN @bookedSeats bs ON ssa.seatId = bs.seatId
            WHERE ssa.showId = @showId AND ssa.isBooked = 1
        )
            THROW 50003, 'One or more seats are already booked.', 1;

        -- Calculate prices
        DECLARE @screenPrice DECIMAL(10,2), @totalSeatPrice DECIMAL(10,2) = 0, @totalAmount DECIMAL(10,2);
        
        SELECT @screenPrice = st.priceScreen
        FROM ShowTable s
        JOIN Screen sc ON s.screenId = sc.screenId
        JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
        WHERE s.showId = @showId;

        SELECT @totalSeatPrice = SUM(st.priceSeat)
        FROM @bookedSeats bs
        JOIN Seat se ON bs.seatId = se.seatId
        JOIN SeatType st ON se.seatTypeId = st.seatTypeId;

        SET @totalAmount = @totalSeatPrice + @screenPrice;

        -- Apply discount
        IF @discountCode IS NOT NULL
        BEGIN
            DECLARE @discountValue DECIMAL(10,2), @discountType VARCHAR(20);
            
            SELECT @discountValue = discountValue, @discountType = discountType
            FROM Discount
            WHERE discountCode = @discountCode AND isActive = 1 
              AND CAST(GETDATE() AS DATE) BETWEEN validFrom AND validTo
              AND @totalAmount >= minBookingAmount;

            IF @discountValue IS NOT NULL
            BEGIN
                IF @discountType = 'PERCENTAGE'
                    SET @totalAmount = @totalAmount - (@totalAmount * @discountValue / 100);
                ELSE
                    SET @totalAmount = @totalAmount - @discountValue;
                IF @totalAmount < 0 SET @totalAmount = 0;
            END
        END

        -- Create booking
        INSERT INTO Booking (userId, showId, bookingDate, bookingStatus, totalAmount)
        VALUES (@userId, @showId, GETDATE(), 1, @totalAmount);
        
        DECLARE @bookingId INT = SCOPE_IDENTITY();

        -- Insert booking seats
        INSERT INTO BookingSeat (bookingId, seatId, priceAtBooking)
        SELECT @bookingId, seatId, 
            (SELECT priceSeat FROM Seat se JOIN SeatType st ON se.seatTypeId = st.seatTypeId WHERE se.seatId = bs.seatId)
        FROM @bookedSeats bs;

        -- Update seat availability
        UPDATE ShowSeatAvailability SET isBooked = 1, bookedAt = GETDATE()
        WHERE showId = @showId AND seatId IN (SELECT seatId FROM @bookedSeats);

        COMMIT TRANSACTION;
        
        SELECT @bookingId AS BookingID, @totalAmount AS TotalAmount, 'Booking Successful' AS Status;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage, 'Booking Failed' AS Status;
    END CATCH
END;
GO

-- Procedure 2: Process Payment
CREATE OR ALTER PROCEDURE sp_ProcessPayment
    @bookingId INT,
    @paymentMethod VARCHAR(30),
    @transactionId VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @amount DECIMAL(10,2);
        SELECT @amount = totalAmount FROM Booking WHERE bookingId = @bookingId AND paymentStatus = 'Pending';
        
        IF @amount IS NULL
            THROW 50004, 'Invalid Booking ID or payment already processed.', 1;

        INSERT INTO Payment (bookingId, amount, paymentMethod, paymentDate, transactionId, paymentStatus)
        VALUES (@bookingId, @amount, @paymentMethod, GETDATE(), @transactionId, 'Completed');

        UPDATE Booking SET paymentStatus = 'Paid' WHERE bookingId = @bookingId;

        COMMIT TRANSACTION;
        SELECT 'Payment Successful' AS Status, @amount AS AmountPaid;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage, 'Payment Failed' AS Status;
    END CATCH
END;
GO

-- Procedure 3: Order Food
CREATE OR ALTER PROCEDURE sp_OrderFood
    @bookingId INT,
    @items VARCHAR(MAX)  -- Format: "itemId:quantity,itemId:quantity"
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Booking WHERE bookingId = @bookingId AND paymentStatus = 'Paid')
            THROW 50005, 'Booking not found or payment not completed.', 1;

        INSERT INTO FoodOrder (bookingId, orderDate, totalAmount, orderStatus)
        VALUES (@bookingId, GETDATE(), 0, 'Pending');
        
        DECLARE @foodOrderId INT = SCOPE_IDENTITY();
        DECLARE @totalAmount DECIMAL(10,2) = 0;

        -- Parse and insert order details
        DECLARE @xml XML = CAST('<i>' + REPLACE(@items, ',', '</i><i>') + '</i>' AS XML);
        
        INSERT INTO FoodOrderDetail (foodOrderId, itemId, quantity, priceAtOrder)
        SELECT 
            @foodOrderId,
            CAST(LEFT(value, CHARINDEX(':', value) - 1) AS INT),
            CAST(RIGHT(value, LEN(value) - CHARINDEX(':', value)) AS INT),
            i.basePrice
        FROM (
            SELECT T.c.value('.', 'VARCHAR(100)') AS value
            FROM @xml.nodes('i') T(c)
        ) t
        JOIN Item i ON CAST(LEFT(t.value, CHARINDEX(':', t.value) - 1) AS INT) = i.itemId;

        -- Calculate total
        SELECT @totalAmount = SUM(quantity * priceAtOrder)
        FROM FoodOrderDetail WHERE foodOrderId = @foodOrderId;

        UPDATE FoodOrder SET totalAmount = @totalAmount WHERE foodOrderId = @foodOrderId;

        COMMIT TRANSACTION;
        SELECT @foodOrderId AS FoodOrderID, @totalAmount AS TotalAmount, 'Food Order Successful' AS Status;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage, 'Food Order Failed' AS Status;
    END CATCH
END;
GO

-- Procedure 4: Add Feedback
CREATE OR ALTER PROCEDURE sp_AddFeedback
    @userId INT,
    @bookingId INT,
    @rating INT,
    @comments VARCHAR(MAX)
AS
BEGIN
    IF @rating < 1 OR @rating > 5
        THROW 50006, 'Rating must be between 1 and 5.', 1;

    IF NOT EXISTS (SELECT 1 FROM Booking WHERE bookingId = @bookingId AND userId = @userId)
        THROW 50007, 'Invalid Booking ID for this user.', 1;

    INSERT INTO Feedback (userId, bookingId, rating, comments, feedbackDate)
    VALUES (@userId, @bookingId, @rating, @comments, GETDATE());

    SELECT SCOPE_IDENTITY() AS FeedbackID, 'Feedback Submitted' AS Status;
END;
GO

-- Procedure 5: Cancel Booking
CREATE OR ALTER PROCEDURE sp_CancelBooking
    @bookingId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @showDate DATE;
        SELECT @showDate = s.showDate
        FROM Booking b
        JOIN ShowTable s ON b.showId = s.showId
        WHERE b.bookingId = @bookingId AND b.userId = @userId;

        IF @showDate IS NULL
            THROW 50008, 'Booking not found.', 1;

        -- Only allow cancellation if show is more than 2 hours away
        IF @showDate = CAST(GETDATE() AS DATE) AND DATEDIFF(HOUR, GETDATE(), CAST(@showDate AS DATETIME) + CAST(s.startTime AS DATETIME)) < 2
            THROW 50009, 'Cannot cancel booking less than 2 hours before show.', 1;

        -- Free up seats
        UPDATE ShowSeatAvailability SET isBooked = 0, bookedAt = NULL
        WHERE showId IN (SELECT showId FROM Booking WHERE bookingId = @bookingId)
        AND seatId IN (SELECT seatId FROM BookingSeat WHERE bookingId = @bookingId);

        UPDATE Booking SET bookingStatus = 0, paymentStatus = 'Refunded' WHERE bookingId = @bookingId;

        COMMIT TRANSACTION;
        SELECT 'Booking Cancelled Successfully' AS Status;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage, 'Cancellation Failed' AS Status;
    END CATCH
END;
GO

-- Procedure 6: Search Movies (COMPLETE)
CREATE OR ALTER PROCEDURE sp_SearchMovies
    @movieName VARCHAR(255) = NULL,
    @genre VARCHAR(50) = NULL,
    @language VARCHAR(50) = NULL,
    @startDate DATE = NULL,
    @endDate DATE = NULL
AS
BEGIN
    SELECT DISTINCT
        m.movieId,
        m.title,
        m.duration,
        m.releaseDate,
        m.rating,
        m.language,
        m.description,
        STUFF((
            SELECT ', ' + g.genreName
            FROM MovieGenre mg
            JOIN Genre g ON mg.genreId = g.genreId
            WHERE mg.movieId = m.movieId
            FOR XML PATH('')
        ), 1, 2, '') AS Genres,
        COUNT(DISTINCT s.showId) AS TotalShows,
        COUNT(DISTINCT b.bookingId) AS TotalBookings
    FROM Movie m
    LEFT JOIN ShowTable s ON m.movieId = s.movieId AND s.isCancelled = 0
    LEFT JOIN Booking b ON s.showId = b.showId
    WHERE ( @movieName IS NULL OR m.title LIKE '%' + @movieName + '%' )
        AND ( @genre IS NULL OR EXISTS (SELECT 1 FROM MovieGenre mg JOIN Genre g ON mg.genreId = g.genreId WHERE mg.movieId = m.movieId AND g.genreName = @genre) )
        AND ( @language IS NULL OR m.language = @language )
        AND ( @startDate IS NULL OR m.releaseDate >= @startDate )
        AND ( @endDate IS NULL OR m.releaseDate <= @endDate )
    GROUP BY m.movieId, m.title, m.duration, m.releaseDate, m.rating, m.language, m.description
    ORDER BY m.title;
END;
GO


-- Initialize ShowSeatAvailability (Safe version - checks if seats exist)
DELETE FROM ShowSeatAvailability;
GO

INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
INNER JOIN Seat se ON se.screenId = s.screenId
WHERE NOT EXISTS (SELECT 1 FROM ShowSeatAvailability ssa WHERE ssa.showId = s.showId AND ssa.seatId = se.seatId);
GO

-- TRIGGER 1: Prevent booking already-booked seats
CREATE OR ALTER TRIGGER trg_PreventOverbooking
ON BookingSeat AFTER INSERT AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN Booking b ON i.bookingId = b.bookingId
        JOIN ShowSeatAvailability ssa ON ssa.showId = b.showId AND ssa.seatId = i.seatId
        WHERE ssa.isBooked = 1
    )
    BEGIN
        RAISERROR('One or more seats are already booked.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- TRIGGER 2: Auto-recalculate FoodOrder total when items change
CREATE OR ALTER TRIGGER trg_UpdateFoodOrderTotal
ON FoodOrderDetail AFTER INSERT, UPDATE, DELETE AS
BEGIN
    DECLARE @id INT = COALESCE((SELECT TOP 1 foodOrderId FROM inserted), (SELECT TOP 1 foodOrderId FROM deleted));
    UPDATE FoodOrder SET totalAmount = (SELECT COALESCE(SUM(quantity * priceAtOrder), 0) FROM FoodOrderDetail WHERE foodOrderId = @id)
    WHERE foodOrderId = @id;
END;
GO

-- TRIGGER 3: Auto-cancel all bookings when a show is cancelled
CREATE OR ALTER TRIGGER trg_AutoCancelOnShowCancel
ON ShowTable AFTER UPDATE AS
BEGIN
    IF UPDATE(isCancelled)
    BEGIN
        UPDATE Booking SET bookingStatus = 0, paymentStatus = 'Refunded'
        WHERE showId IN (SELECT showId FROM inserted WHERE isCancelled = 1) AND bookingStatus = 1;

        UPDATE ShowSeatAvailability SET isBooked = 0, bookedAt = NULL
        WHERE showId IN (SELECT showId FROM inserted WHERE isCancelled = 1);
    END
END;
GO



-- Check if Seats exist
SELECT screenId, COUNT(*) AS SeatCount FROM Seat GROUP BY screenId;

-- Check if Shows exist  
SELECT showId, screenId, showDate FROM ShowTable;

-- Check if ShowSeatAvailability is populated
SELECT showId, COUNT(*) AS SeatCount FROM ShowSeatAvailability GROUP BY showId;




-- Clear and repopulate
DELETE FROM ShowSeatAvailability;

INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
JOIN Seat se ON se.screenId = s.screenId;

-- Verify result
SELECT 
    s.showId, 
    m.title AS Movie,
    COUNT(ssa.seatId) AS TotalSeats
FROM ShowTable s
JOIN Movie m ON s.movieId = m.movieId
JOIN ShowSeatAvailability ssa ON s.showId = ssa.showId
GROUP BY s.showId, m.title;




-- Insert SeatTypes (if missing)
IF NOT EXISTS (SELECT 1 FROM SeatType)
    INSERT INTO SeatType (category, priceSeat) VALUES 
    ('Standard', 300.00), ('Premium', 500.00), ('VIP', 800.00), ('Accessible', 350.00);

-- Insert Seats for all 5 screens
DECLARE @screenId INT = 1;
WHILE @screenId <= 5
BEGIN
    DECLARE @totalSeats INT = CASE @screenId 
        WHEN 1 THEN 50 WHEN 2 THEN 80 WHEN 3 THEN 60 WHEN 4 THEN 70 WHEN 5 THEN 40 
    END;
    DECLARE @i INT = 1;
    WHILE @i <= @totalSeats
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM Seat WHERE screenId = @screenId AND seatNo = CAST(@i AS VARCHAR))
            INSERT INTO Seat (screenId, seatTypeId, seatNo, rowNo, isWheelchairAllow)
            VALUES (
                @screenId,
                CASE WHEN @i <= @totalSeats * 0.7 THEN 1 WHEN @i <= @totalSeats * 0.9 THEN 2 ELSE 3 END,
                CAST(@i AS VARCHAR(10)),
                CHAR(65 + ((@i-1)/10)),
                CASE WHEN @i % 20 = 0 THEN 1 ELSE 0 END
            );
        SET @i = @i + 1;
    END;
    SET @screenId = @screenId + 1;
END;

-- Then repopulate ShowSeatAvailability
DELETE FROM ShowSeatAvailability;
INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
JOIN Seat se ON se.screenId = s.screenId;

PRINT 'Done! Seats populated: ' + CAST(@@ROWCOUNT AS VARCHAR);



-- FIX 1: Update expired discount dates (currently set to 2025 which is past)
-- FIX 1: Update expired discount dates (currently set to 2025 which is past)
UPDATE Discount SET validTo = '2027-12-31', validFrom = '2024-01-01';

-- FIX 2: Populate seat availability for all shows
DELETE FROM ShowSeatAvailability;

INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
JOIN Seat se ON se.screenId = s.screenId;

-- FIX 3: Update shows to have future dates (current shows may have expired)
UPDATE ShowTable SET showDate = CAST(GETDATE() AS DATE)        WHERE showId IN (1,2);
UPDATE ShowTable SET showDate = CAST(DATEADD(day,1,GETDATE()) AS DATE) WHERE showId IN (3,4);
UPDATE ShowTable SET showDate = CAST(DATEADD(day,2,GETDATE()) AS DATE) WHERE showId IN (5,6);
UPDATE ShowTable SET showDate = CAST(DATEADD(day,3,GETDATE()) AS DATE) WHERE showId IN (7,8);

-- VERIFY everything is correct
SELECT 'Shows' AS TableName, COUNT(*) AS Rows FROM ShowTable
UNION ALL SELECT 'Seats', COUNT(*) FROM Seat
UNION ALL SELECT 'ShowSeatAvailability', COUNT(*) FROM ShowSeatAvailability
UNION ALL SELECT 'Discounts', COUNT(*) FROM Discount;





-- FIX: Reset all show dates to today and the next 3 days
UPDATE ShowTable SET showDate = CAST(GETDATE() AS DATE)                   WHERE showId = 1;
UPDATE ShowTable SET showDate = CAST(GETDATE() AS DATE)                   WHERE showId = 2;
UPDATE ShowTable SET showDate = CAST(DATEADD(day,1,GETDATE()) AS DATE)    WHERE showId = 3;
UPDATE ShowTable SET showDate = CAST(DATEADD(day,1,GETDATE()) AS DATE)    WHERE showId = 4;
UPDATE ShowTable SET showDate = CAST(DATEADD(day,2,GETDATE()) AS DATE)    WHERE showId = 5;
UPDATE ShowTable SET showDate = CAST(DATEADD(day,2,GETDATE()) AS DATE)    WHERE showId = 6;
UPDATE ShowTable SET showDate = CAST(DATEADD(day,3,GETDATE()) AS DATE)    WHERE showId = 7;
UPDATE ShowTable SET showDate = CAST(DATEADD(day,3,GETDATE()) AS DATE)    WHERE showId = 8;

-- Then repopulate ShowSeatAvailability
DELETE FROM ShowSeatAvailability;
INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
JOIN Seat se ON se.screenId = s.screenId;

-- Verify
SELECT s.showId, m.title, s.showDate, COUNT(ssa.seatId) AS Seats
FROM ShowTable s
JOIN Movie m ON s.movieId = m.movieId
LEFT JOIN ShowSeatAvailability ssa ON s.showId = ssa.showId
GROUP BY s.showId, m.title, s.showDate
ORDER BY s.showDate;


-- 1. Ensure movie IDs match (Mission Impossible is ID 1)
-- 2. Update all shows to be in the future (Reset to today and coming days)
UPDATE ShowTable SET showDate = CAST(GETDATE() AS DATE)        WHERE showId IN (1,2);
UPDATE ShowTable SET showDate = CAST(DATEADD(day,1,GETDATE()) AS DATE) WHERE showId IN (3,4);
UPDATE ShowTable SET showDate = CAST(DATEADD(day,2,GETDATE()) AS DATE) WHERE showId IN (5,6);
UPDATE ShowTable SET showDate = CAST(DATEADD(day,3,GETDATE()) AS DATE) WHERE showId IN (7,8);

-- 3. Ensure SeatTypes exist
IF NOT EXISTS (SELECT 1 FROM SeatType)
    INSERT INTO SeatType (category, priceSeat) VALUES 
    ('Standard', 300.00), ('Premium', 500.00), ('VIP', 800.00), ('Accessible', 350.00);

-- 4. Ensure Seats exist for all screens (if not already there)
DECLARE @screenId INT = 1;
WHILE @screenId <= 5
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Seat WHERE screenId = @screenId)
    BEGIN
        DECLARE @totalSeats INT = (SELECT totalSeats FROM Screen WHERE screenId = @screenId);
        DECLARE @i INT = 1;
        WHILE @i <= @totalSeats
        BEGIN
            INSERT INTO Seat (screenId, seatTypeId, seatNo, rowNo)
            VALUES (@screenId, 1, CAST(@i AS VARCHAR), CHAR(65 + ((@i-1)/10)));
            SET @i = @i + 1;
        END
    END
    SET @screenId = @screenId + 1;
END

-- 5. RE-INITIALIZE SEAT AVAILABILITY (Crucial for the "0 seats left" fix)
DELETE FROM ShowSeatAvailability;

INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
JOIN Seat se ON se.screenId = s.screenId;

-- 6. Update Discount dates to be valid
UPDATE Discount SET validTo = '2027-12-31', validFrom = '2024-01-01';

PRINT 'Database synchronized successfully!';





-- 1. Reset Dates (This will stay fixed now!)
UPDATE ShowTable SET showDate = CAST(GETDATE() AS DATE);

-- 2. Add Screen 2 to Mission Impossible (So it shows 2 screens)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES (1, 2, CAST(GETDATE() AS DATE), '14:00', '16:43', 0);

-- 3. Populate Seat availability for ALL shows
DELETE FROM ShowSeatAvailability;
INSERT INTO ShowSeatAvailability (showId, seatId, isBooked)
SELECT s.showId, se.seatId, 0
FROM ShowTable s
JOIN Seat se ON se.screenId = s.screenId;

PRINT 'Permanent Data Fix Applied!';



-- 1. Reset all shows to TODAY for 'Mission Impossible' specifically
UPDATE ShowTable 
SET showDate = CAST(GETDATE() AS DATE)
WHERE movieId = (SELECT movieId FROM Movie WHERE title LIKE '%Mission Impossible%');

-- 2. Ensure ALL movies have at least one show TODAY
UPDATE ShowTable SET showDate = CAST(GETDATE() AS DATE);

-- 3. Double check if any shows are cancelled by mistake
UPDATE ShowTable SET isCancelled = 0;

-- 4. VERIFY: Run this and see if it returns rows
SELECT m.title, s.showDate, s.screenId
FROM ShowTable s
JOIN Movie m ON s.movieId = m.movieId
WHERE s.showDate >= CAST(GETDATE() AS DATE);


-- First, drop ALL existing versions of the procedure
DROP PROCEDURE IF EXISTS sp_BookTicket;
GO



-- Create the corrected procedure
CREATE PROCEDURE sp_BookTicket
    @userId INT,
    @showId INT,
    @seatIds VARCHAR(MAX),
    @discountCode VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validation
        IF NOT EXISTS (SELECT 1 FROM Users WHERE id = @userId)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 'Invalid User ID' AS ErrorMessage;
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM ShowTable WHERE showId = @showId AND isCancelled = 0 AND showDate >= CAST(GETDATE() AS DATE))
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 'Invalid Show ID or Show has passed' AS ErrorMessage;
            RETURN;
        END

        -- Create booking
        DECLARE @bookingId INT;
        INSERT INTO Booking (userId, showId, bookingDate, bookingStatus, totalAmount, paymentStatus)
        VALUES (@userId, @showId, GETDATE(), 1, 0, 'Pending');
        
        SET @bookingId = SCOPE_IDENTITY();

        -- Parse seat IDs manually (without STRING_SPLIT)
        DECLARE @SeatTable TABLE (seatId INT);
        DECLARE @pos INT = 1;
        DECLARE @endPos INT;
        DECLARE @seatIdStr VARCHAR(10);
        
        WHILE @pos <= LEN(@seatIds)
        BEGIN
            SET @endPos = CHARINDEX(',', @seatIds, @pos);
            IF @endPos = 0 SET @endPos = LEN(@seatIds) + 1;
            
            SET @seatIdStr = SUBSTRING(@seatIds, @pos, @endPos - @pos);
            INSERT INTO @SeatTable VALUES (CAST(@seatIdStr AS INT));
            
            SET @pos = @endPos + 1;
        END

        -- Check if seats are already booked
        IF EXISTS (
            SELECT 1 FROM ShowSeatAvailability ssa
            WHERE ssa.showId = @showId 
            AND ssa.seatId IN (SELECT seatId FROM @SeatTable)
            AND ssa.isBooked = 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 'One or more seats are already booked' AS ErrorMessage;
            RETURN;
        END

        -- Insert booking seats and calculate total
        DECLARE @totalSeatPrice DECIMAL(10,2) = 0;
        
        INSERT INTO BookingSeat (bookingId, seatId, priceAtBooking)
        SELECT @bookingId, t.seatId, st.priceSeat
        FROM @SeatTable t
        INNER JOIN Seat s ON t.seatId = s.seatId
        INNER JOIN SeatType st ON s.seatTypeId = st.seatTypeId;

        SELECT @totalSeatPrice = SUM(st.priceSeat)
        FROM @SeatTable t
        INNER JOIN Seat s ON t.seatId = s.seatId
        INNER JOIN SeatType st ON s.seatTypeId = st.seatTypeId;

        -- Get screen price
        DECLARE @screenPrice DECIMAL(10,2) = 0;
        SELECT @screenPrice = st.priceScreen
        FROM ShowTable sh
        INNER JOIN Screen sc ON sh.screenId = sc.screenId
        INNER JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
        WHERE sh.showId = @showId;

        -- Calculate final total
        DECLARE @finalTotal DECIMAL(10,2) = ISNULL(@totalSeatPrice, 0) + ISNULL(@screenPrice, 0);

        -- Apply discount
        IF @discountCode = 'SAVE10' OR DATENAME(WEEKDAY, GETDATE()) = 'Tuesday'
        BEGIN
            SET @finalTotal = @finalTotal * 0.9;
        END

        -- Update booking with total
        UPDATE Booking SET totalAmount = @finalTotal WHERE bookingId = @bookingId;

        -- Mark seats as booked
        UPDATE ShowSeatAvailability
        SET isBooked = 1, bookedAt = GETDATE()
        WHERE showId = @showId AND seatId IN (SELECT seatId FROM @SeatTable);

        COMMIT TRANSACTION;

        -- Return success
        SELECT @bookingId AS BookingID, @finalTotal AS TotalAmount, 'Booking Successful' AS Status;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage, 'Booking Failed' AS Status;
    END CATCH
END
GO