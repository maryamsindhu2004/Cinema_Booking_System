/* ===============================================================
   THEATRO CINEMA SYSTEM - BCNF UPDATED SCHEMA
   =============================================================== */

-- CLEANUP: Drop existing tables in correct order (Children first)
DROP TABLE IF EXISTS FoodOrderDetail;
DROP TABLE IF EXISTS FoodOrder;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS BookingSeat;
DROP TABLE IF EXISTS Booking;
DROP TABLE IF EXISTS ShowTable;
DROP TABLE IF EXISTS MovieGenre;
DROP TABLE IF EXISTS Movie;
DROP TABLE IF EXISTS Genre;
DROP TABLE IF EXISTS Seat;
DROP TABLE IF EXISTS Screen;
DROP TABLE IF EXISTS ScreenType;
DROP TABLE IF EXISTS Cinema;
DROP TABLE IF EXISTS SeatType;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Discount;
DROP TABLE IF EXISTS Item;
GO


-- 1. Users Table
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

-- 7. Movie Table (BCNF: No genre column here)
CREATE TABLE Movie (
    movieId INT PRIMARY KEY IDENTITY(1,1),
    title VARCHAR(255) NOT NULL,
    duration INT CHECK (duration > 0),
    releaseDate DATE,
    rating VARCHAR(10),
    language VARCHAR(50)
);

-- 8. Genre Table (BCNF Addition)
CREATE TABLE Genre (
    genreId INT PRIMARY KEY IDENTITY(1,1),
    genreName VARCHAR(50) UNIQUE NOT NULL
);

-- 9. MovieGenre Table (BCNF Addition)
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
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (showId) REFERENCES ShowTable(showId)
);

-- 12. BookingSeat Table (BCNF Addition)
CREATE TABLE BookingSeat (
    bookingId INT NOT NULL,
    seatId INT NOT NULL,
    PRIMARY KEY (bookingId, seatId),
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE,
    FOREIGN KEY (seatId) REFERENCES Seat(seatId)
);

-- 13. Item Table (BCNF Addition)
CREATE TABLE Item (
    itemId INT PRIMARY KEY IDENTITY(1,1),
    itemName VARCHAR(100) NOT NULL,
    basePrice DECIMAL(10,2) NOT NULL CHECK (basePrice >= 0)
);

-- 14. FoodOrder Table
CREATE TABLE FoodOrder (
    foodOrderId INT PRIMARY KEY IDENTITY(1,1),
    bookingId INT NOT NULL,
    orderDate DATETIME DEFAULT GETDATE(),
    totalAmount DECIMAL(10,2) DEFAULT 0 CHECK (totalAmount >= 0),
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE
);

-- 15. FoodOrderDetail Table (BCNF: Removed price column)
CREATE TABLE FoodOrderDetail (
    foodOrderId INT NOT NULL,
    itemId INT NOT NULL,
    quantity INT CHECK (quantity > 0),
    PRIMARY KEY (foodOrderId, itemId),
    FOREIGN KEY (foodOrderId) REFERENCES FoodOrder(foodOrderId) ON DELETE CASCADE,
    FOREIGN KEY (itemId) REFERENCES Item(itemId)
);

-- 16. Discount Table
CREATE TABLE Discount (
    discountId INT PRIMARY KEY IDENTITY(1,1),
    discountCode VARCHAR(50) UNIQUE NOT NULL,
    discountType VARCHAR(20) CHECK (discountType IN ('PERCENTAGE','FIXED')),
    discountValue DECIMAL(10,2) CHECK (discountValue >= 0),
    validFrom DATE,
    validTo DATE,
    applicableDays VARCHAR(50),
    isActive BIT DEFAULT 1
);

/* ===============================================================
   SEED DATA (NORMALIZED)
   =============================================================== */

-- Insert Genres
INSERT INTO Genre (genreName) VALUES ('Action'), ('Drama'), ('Comedy'), ('Romance'), ('Sci-Fi'), ('Crime');
INSERT INTO Genre (genreName) VALUES 
('Thriller'),
('Horror'),
('Musical'),
('Biography');

GO
-- Insert Movie: Mission Impossible
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Mission Impossible – Dead Reckoning', 163, '2023-07-12', 'PG-13', 'English');
INSERT INTO MovieGenre (movieId, genreId) VALUES (SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action'));

INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('PK', 340, '2013-12-14', 'PG-1', 'Hindi');
INSERT INTO MovieGenre (movieId, genreId) VALUES (SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Comedy'));






-- Insert Items
INSERT INTO Item (itemName, basePrice) VALUES ('Popcorn Large', 500.00), ('Coke', 200.00), ('Nachos', 450.00);


-- 1. The Legend of Maula Jatt
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('The Legend of Maula Jatt', 153, '2022-10-13', 'PG', 'Urdu');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Crime'));
GO

-- 2. Teefa in Trouble
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Teefa in Trouble', 155, '2018-07-20', 'PG', 'Urdu');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Comedy'));
GO

-- 3. London Nahi Jaunga
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('London Nahi Jaunga', 140, '2022-07-10', 'PG', 'Urdu');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Romance')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Drama'));
GO

-- 4. Quaid-e-Azam Zindabad
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Quaid-e-Azam Zindabad', 148, '2022-08-31', 'PG', 'Urdu');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Comedy'));
GO

-- 5. Superstar
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Superstar', 135, '2019-08-09', 'PG', 'Urdu');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Romance')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Drama'));
GO

-- ============================================================
-- INDIAN MOVIES (5 Movies)
-- ============================================================

-- 6. Jawan
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Jawan', 169, '2023-09-07', 'UA', 'Hindi');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Thriller'));
GO

-- 7. Pathaan
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Pathaan', 146, '2023-01-25', 'UA', 'Hindi');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Thriller'));
GO

-- 8. Animal
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Animal', 201, '2023-12-01', 'A', 'Hindi');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Crime')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Drama'));
GO

-- 9. Dunki
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Dunki', 161, '2023-12-21', 'UA', 'Hindi');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Comedy')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Drama'));
GO

-- 10. Rocky Aur Rani Kii Prem Kahaani
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Rocky Aur Rani Kii Prem Kahaani', 168, '2023-07-28', 'UA', 'Hindi');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Romance')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Drama')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Comedy'));
GO

-- ============================================================
-- ENGLISH MOVIES (5 Movies)
-- ============================================================

-- 11. Oppenheimer
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Oppenheimer', 180, '2023-07-21', 'R', 'English');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Drama')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Biography'));
GO



-- 12. Barbie
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Barbie', 114, '2023-07-21', 'PG-13', 'English');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Comedy')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Musical'));
GO

-- 13. John Wick: Chapter 4
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('John Wick: Chapter 4', 169, '2023-03-24', 'R', 'English');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Thriller')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Crime'));
GO

-- 14. The Batman
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('The Batman', 176, '2022-03-04', 'PG-13', 'English');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Crime')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Thriller'));
GO

-- 15. Top Gun: Maverick
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Top Gun: Maverick', 131, '2022-05-27', 'PG-13', 'English');
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action')),
(SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Drama'));
GO

--select* from Users



-- =============================================
-- STEP 1: Insert Cinema
-- =============================================
INSERT INTO Cinema (name, location, contact, openingTime, closingTime, isActive)
VALUES 
('Cineplex Gold', 'Lahore, Main Boulevard', '042-111-111-111', '09:00', '23:00', 1),


/*delete from Cinema where name='Cineplex Pearl'*/
/*update Cinema
set name='Theatro' where  name ='Cineplex Gold'*/
--select* from Cinema


-- =============================================
-- STEP 2: Insert Screen Types
-- =============================================
INSERT INTO ScreenType (typeName, description, priceScreen)
VALUES 
('IMAX', 'Premium large format', 800.00),
('Standard', 'Regular digital screen', 400.00),
('4DX', 'Motion seats with effects', 1000.00);

--update ScreenType
--set typeName='3D'
--where typeName='4DX'



-- =============================================
-- STEP 3: Insert Screens
-- =============================================
INSERT INTO Screen (cinemaId, screenTypeId, totalSeats, isActive)
VALUES 
(1, 1, 200, 1),  -- Cineplex Gold - IMAX
(1, 2, 150, 1),  -- Cineplex Gold - Standard
(1, 1, 180, 1),  -- Cineplex Pearl - IMAX
(1, 3, 120, 1);  -- Cineplex Pearl - 4DX

/*update Screen
set cinemaId=1
where cinemaId=2*/



-- =============================================
-- STEP 4: Insert Seat Types
-- =============================================
INSERT INTO SeatType (category, priceSeat)
VALUES 
('Premium', 1000.00),
('Standard', 500),
('Platinum', 1500.00);
--update SeatType
--set  priceSeat=1000
--where seatTypeId=2

select* from SeatType
-- =============================================
-- STEP 5: Insert Seats (Sample for Screen 1)
-- =============================================
-- Screen 1 (IMAX) - 10 sample seats
INSERT INTO Seat (screenId, seatTypeId, seatNo, rowNo, isActive, isWheelchairAllow)
VALUES 
(1, 2, 'A1', 'A', 1, 0),
(1, 2, 'A2', 'A', 1, 0),
(1, 1, 'B1', 'B', 1, 1),  -- Premium + wheelchair
(1, 1, 'B2', 'B', 1, 0),
(1, 3, 'C1', 'C', 1, 0),  -- Recliner
(1, 3, 'C2', 'C', 1, 0),
(1, 2, 'D1', 'D', 1, 0),
(1, 2, 'D2', 'D', 1, 0),
(1, 1, 'E1', 'E', 1, 1),  -- Premium + wheelchair
(1, 2, 'E2', 'E', 1, 0);

-- =============================================
-- ADD MORE SHOWTIMES FOR ALL MOVIES
-- =============================================

--delete from ShowTable
select* from ShowTable


-- =============================================
-- FIRST: Check what screens actually exist
-- =============================================
SELECT screenId, cinemaId, screenTypeId FROM Screen ORDER BY screenId;

-- =============================================

-- Screen 1 (IMAX)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
-- Mission Impossible (163 min)
((SELECT movieId FROM Movie WHERE title = 'Mission Impossible – Dead Reckoning'), 1, '2025-05-20', '11:00', '13:43', 0),
((SELECT movieId FROM Movie WHERE title = 'Mission Impossible – Dead Reckoning'), 1, '2025-05-20', '14:00', '16:43', 0),
((SELECT movieId FROM Movie WHERE title = 'Mission Impossible – Dead Reckoning'), 1, '2025-05-20', '20:30', '23:13', 0),

-- Oppenheimer (180 min)
((SELECT movieId FROM Movie WHERE title = 'Oppenheimer'), 1, '2025-05-20', '17:00', '20:00', 0),

-- John Wick 4 (169 min) - FIXED: No overnight (changed to end by 23:59)
((SELECT movieId FROM Movie WHERE title = 'John Wick: Chapter 4'), 1, '2025-05-20', '21:30', '23:59', 0);

-- Screen 2 (Standard)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
-- PK (340 min - long movie)
((SELECT movieId FROM Movie WHERE title = 'PK'), 2, '2025-05-20', '10:00', '15:40', 0),

-- Jawan (169 min)
((SELECT movieId FROM Movie WHERE title = 'Jawan'), 2, '2025-05-20', '12:30', '15:19', 0),
((SELECT movieId FROM Movie WHERE title = 'Jawan'), 2, '2025-05-20', '16:00', '18:49', 0),
((SELECT movieId FROM Movie WHERE title = 'Jawan'), 2, '2025-05-20', '19:30', '22:19', 0),

-- Pathaan (146 min)
((SELECT movieId FROM Movie WHERE title = 'Pathaan'), 2, '2025-05-20', '11:00', '13:26', 0),
((SELECT movieId FROM Movie WHERE title = 'Pathaan'), 2, '2025-05-20', '14:00', '16:26', 0),
((SELECT movieId FROM Movie WHERE title = 'Pathaan'), 2, '2025-05-20', '17:00', '19:26', 0),
((SELECT movieId FROM Movie WHERE title = 'Pathaan'), 2, '2025-05-20', '20:00', '22:26', 0),

-- The Legend of Maula Jatt (153 min)
((SELECT movieId FROM Movie WHERE title = 'The Legend of Maula Jatt'), 2, '2025-05-20', '15:30', '18:03', 0),
((SELECT movieId FROM Movie WHERE title = 'The Legend of Maula Jatt'), 2, '2025-05-20', '21:00', '23:33', 0),

-- Top Gun: Maverick (131 min)
((SELECT movieId FROM Movie WHERE title = 'Top Gun: Maverick'), 2, '2025-05-20', '10:30', '12:41', 0),
((SELECT movieId FROM Movie WHERE title = 'Top Gun: Maverick'), 2, '2025-05-20', '13:00', '15:11', 0),
((SELECT movieId FROM Movie WHERE title = 'Top Gun: Maverick'), 2, '2025-05-20', '16:00', '18:11', 0),

-- The Batman (176 min)
((SELECT movieId FROM Movie WHERE title = 'The Batman'), 2, '2025-05-20', '12:00', '14:56', 0),
((SELECT movieId FROM Movie WHERE title = 'The Batman'), 2, '2025-05-20', '18:30', '21:26', 0),

-- Animal (201 min)
((SELECT movieId FROM Movie WHERE title = 'Animal'), 2, '2025-05-20', '15:00', '18:21', 0),

-- Barbie (114 min)
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-20', '11:30', '13:24', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-20', '14:30', '16:24', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-20', '17:30', '19:24', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-20', '20:30', '22:24', 0),

-- Dunki (161 min)
((SELECT movieId FROM Movie WHERE title = 'Dunki'), 2, '2025-05-20', '13:30', '16:11', 0),
((SELECT movieId FROM Movie WHERE title = 'Dunki'), 2, '2025-05-20', '17:00', '19:41', 0),

-- Rocky Aur Rani (168 min)
((SELECT movieId FROM Movie WHERE title = 'Rocky Aur Rani Kii Prem Kahaani'), 2, '2025-05-20', '12:00', '14:48', 0),
((SELECT movieId FROM Movie WHERE title = 'Rocky Aur Rani Kii Prem Kahaani'), 2, '2025-05-20', '19:00', '21:48', 0);

-- =============================================
-- SHOWTIMES FOR MAY 21, 2025
-- =============================================

-- Screen 1 (IMAX)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
((SELECT movieId FROM Movie WHERE title = 'John Wick: Chapter 4'), 1, '2025-05-21', '10:00', '12:49', 0),
((SELECT movieId FROM Movie WHERE title = 'Mission Impossible – Dead Reckoning'), 1, '2025-05-21', '13:30', '16:13', 0),
((SELECT movieId FROM Movie WHERE title = 'Oppenheimer'), 1, '2025-05-21', '17:00', '20:00', 0),
((SELECT movieId FROM Movie WHERE title = 'The Batman'), 1, '2025-05-21', '20:30', '23:26', 0);

-- Screen 2 (Standard)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
((SELECT movieId FROM Movie WHERE title = 'PK'), 2, '2025-05-21', '10:00', '15:40', 0),
((SELECT movieId FROM Movie WHERE title = 'Jawan'), 2, '2025-05-21', '16:00', '18:49', 0),
((SELECT movieId FROM Movie WHERE title = 'Pathaan'), 2, '2025-05-21', '19:00', '21:26', 0),
((SELECT movieId FROM Movie WHERE title = 'Top Gun: Maverick'), 2, '2025-05-21', '11:00', '13:11', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-21', '13:30', '15:24', 0),
((SELECT movieId FROM Movie WHERE title = 'The Legend of Maula Jatt'), 2, '2025-05-21', '18:00', '20:33', 0),
((SELECT movieId FROM Movie WHERE title = 'Dunki'), 2, '2025-05-21', '15:30', '18:11', 0),
((SELECT movieId FROM Movie WHERE title = 'Animal'), 2, '2025-05-21', '20:30', '23:51', 0);

-- =============================================
-- SHOWTIMES FOR MAY 22, 2025
-- =============================================

-- Screen 1 (IMAX)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
((SELECT movieId FROM Movie WHERE title = 'Mission Impossible – Dead Reckoning'), 1, '2025-05-22', '09:00', '11:43', 0),
((SELECT movieId FROM Movie WHERE title = 'Oppenheimer'), 1, '2025-05-22', '12:00', '15:00', 0),
((SELECT movieId FROM Movie WHERE title = 'John Wick: Chapter 4'), 1, '2025-05-22', '15:30', '18:19', 0),
((SELECT movieId FROM Movie WHERE title = 'The Batman'), 1, '2025-05-22', '19:00', '21:56', 0),
-- FIXED: No overnight (end time adjusted)
((SELECT movieId FROM Movie WHERE title = 'Mission Impossible – Dead Reckoning'), 1, '2025-05-22', '22:00', '23:59', 0);

-- Screen 2 (Standard)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
((SELECT movieId FROM Movie WHERE title = 'PK'), 2, '2025-05-22', '09:00', '14:40', 0),
((SELECT movieId FROM Movie WHERE title = 'Jawan'), 2, '2025-05-22', '15:00', '17:49', 0),
((SELECT movieId FROM Movie WHERE title = 'Pathaan'), 2, '2025-05-22', '18:00', '20:26', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-22', '10:00', '11:54', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-22', '12:30', '14:24', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-22', '15:00', '16:54', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-22', '17:30', '19:24', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-22', '20:00', '21:54', 0),
((SELECT movieId FROM Movie WHERE title = 'Dunki'), 2, '2025-05-22', '20:30', '23:11', 0),
((SELECT movieId FROM Movie WHERE title = 'The Legend of Maula Jatt'), 2, '2025-05-22', '17:00', '19:33', 0),
((SELECT movieId FROM Movie WHERE title = 'Teefa in Trouble'), 2, '2025-05-22', '20:00', '22:35', 0),
((SELECT movieId FROM Movie WHERE title = 'Rocky Aur Rani Kii Prem Kahaani'), 2, '2025-05-22', '17:30', '20:18', 0),
((SELECT movieId FROM Movie WHERE title = 'Top Gun: Maverick'), 2, '2025-05-22', '10:00', '12:11', 0),
((SELECT movieId FROM Movie WHERE title = 'Animal'), 2, '2025-05-22', '13:00', '16:21', 0);

-- =============================================
-- VERIFY ALL SHOWTIMES
-- =============================================
SELECT 
    s.showId,
    m.title,
    m.language,
    c.name AS Cinema,
    st.typeName AS ScreenType,
    s.showDate,
    CAST(s.startTime AS VARCHAR(5)) AS StartTime,
    CAST(s.endTime AS VARCHAR(5)) AS EndTime,
    m.duration AS Duration_Minutes
FROM ShowTable s
JOIN Movie m ON s.movieId = m.movieId
JOIN Screen sc ON s.screenId = sc.screenId
JOIN Cinema c ON sc.cinemaId = c.cinemaId
JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
WHERE s.showDate >= '2025-05-20'
ORDER BY s.showDate, s.startTime;