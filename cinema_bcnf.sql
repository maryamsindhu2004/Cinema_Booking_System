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
INSERT INTO Item (itemName, basePrice) VALUES ('Popcorn Small', 300.00), ('Hot Dogs', 400.00), ('Cookies', 150.00),('mix nuts', 400.00), ('Chocolates', 250.00);

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
(1, 2, 'F1', 'F', 1, 0),
(1, 2, 'G2', 'G', 1, 0),
(1, 1, 'H1', 'H', 1, 1),  -- Premium + wheelchair
(1, 1, 'I2', 'I', 1, 0),
(2, 3, 'F1', 'F', 1, 0),  
(2, 3, 'G2', 'G', 1, 0),
(2, 2, 'I1', 'I', 1, 0),
(2, 2, 'H1', 'H', 1, 0);
INSERT INTO Seat (screenId, seatTypeId, seatNo, rowNo, isActive, isWheelchairAllow)
VALUES 
(1, 2, 'F2', 'F', 1, 0),
(1, 2, 'G1', 'G', 1, 0),
(1, 1, 'H2', 'H', 1, 1),  -- Premium + wheelchair
(1, 1, 'I1', 'I', 1, 0),
(2, 3, 'F2', 'F', 1, 0),  
(2, 3, 'G1', 'G', 1, 0),
(2, 2, 'I2', 'I', 1, 0),
(2, 2, 'H2', 'H', 1, 0),


(2, 2, 'A1', 'A', 1, 0),
(2, 2, 'A2', 'A', 1, 0),
(2, 1, 'B1', 'B', 1, 1),  -- Premium + wheelchair
(2, 1, 'B2', 'B', 1, 0),
(2, 3, 'C1', 'C', 1, 0),  
(2, 3, 'C2', 'C', 1, 0),
(2, 2, 'D1', 'D', 1, 0),
(2, 2, 'D2', 'D', 1, 0),
(2, 1, 'E1', 'E', 1, 1),  -- Premium + wheelchair
(2, 2, 'E2', 'E', 1, 0),

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


--SELECT screenId, cinemaId, screenTypeId, totalSeats, isActive 
--FROM Screen 
--ORDER BY screenId;


--select * from Seat

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
-- ADD MORE SHOWTIMES FOR SCREEN 2 (Standard)
-- =============================================

-- First, check existing shows for screen 2
SELECT showId, movieId, showDate, startTime, endTime 
FROM ShowTable 
WHERE screenId = 2 
ORDER BY showDate, startTime;

-- =============================================
-- SHOWTIMES FOR MAY 23, 2025 (Friday)
-- =============================================

INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
-- Morning shows
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-23', '09:00', '10:54', 0),
((SELECT movieId FROM Movie WHERE title = 'Top Gun: Maverick'), 2, '2025-05-23', '11:30', '13:41', 0),

-- Afternoon shows
((SELECT movieId FROM Movie WHERE title = 'Jawan'), 2, '2025-05-23', '14:00', '16:49', 0),
((SELECT movieId FROM Movie WHERE title = 'The Legend of Maula Jatt'), 2, '2025-05-23', '17:30', '20:03', 0),

-- Evening shows
((SELECT movieId FROM Movie WHERE title = 'Pathaan'), 2, '2025-05-23', '20:30', '22:56', 0);

-- =============================================
-- SHOWTIMES FOR MAY 24, 2025 (Saturday - More shows)
-- =============================================

INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
-- Morning
((SELECT movieId FROM Movie WHERE title = 'PK'), 2, '2025-05-24', '09:00', '14:40', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-24', '15:00', '16:54', 0),

-- Afternoon
((SELECT movieId FROM Movie WHERE title = 'Dunki'), 2, '2025-05-24', '17:30', '20:11', 0),

-- Evening
((SELECT movieId FROM Movie WHERE title = 'Animal'), 2, '2025-05-24', '20:30', '23:51', 0);

-- =============================================
-- SHOWTIMES FOR MAY 25, 2025 (Sunday)
-- =============================================

INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
((SELECT movieId FROM Movie WHERE title = 'The Batman'), 2, '2025-05-25', '10:00', '12:56', 0),
((SELECT movieId FROM Movie WHERE title = 'John Wick: Chapter 4'), 2, '2025-05-25', '13:30', '16:19', 0),
((SELECT movieId FROM Movie WHERE title = 'Rocky Aur Rani Kii Prem Kahaani'), 2, '2025-05-25', '17:00', '19:48', 0),
((SELECT movieId FROM Movie WHERE title = 'Teefa in Trouble'), 2, '2025-05-25', '20:00', '22:35', 0);

-- =============================================
-- SHOWTIMES FOR MAY 26, 2025 (Monday)
-- =============================================

INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
((SELECT movieId FROM Movie WHERE title = 'Oppenheimer'), 2, '2025-05-26', '11:00', '14:00', 0),
((SELECT movieId FROM Movie WHERE title = 'Mission Impossible – Dead Reckoning'), 2, '2025-05-26', '15:00', '17:43', 0),
((SELECT movieId FROM Movie WHERE title = 'Barbie'), 2, '2025-05-26', '18:30', '20:24', 0);

-- =============================================
-- VERIFY ALL SHOWTIMES FOR SCREEN 2
-- =============================================

SELECT 
    s.showId,
    m.title AS Movie,
    m.language,
    s.showDate,
    CAST(s.startTime AS VARCHAR(5)) AS StartTime,
    CAST(s.endTime AS VARCHAR(5)) AS EndTime,
    m.duration AS Minutes
FROM ShowTable s
JOIN Movie m ON s.movieId = m.movieId
WHERE s.screenId = 2
ORDER BY s.showDate, s.startTime;

-- =============================================
-- COUNT SHOWS PER DAY FOR SCREEN 2
-- =============================================

SELECT 
    showDate,
    COUNT(*) AS NumberOfShows
FROM ShowTable
WHERE screenId = 2
GROUP BY showDate
ORDER BY showDate;
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

select* from Item


CREATE TABLE Refund (
    refundId INT PRIMARY KEY IDENTITY(1,1),
    bookingId INT NOT NULL,
    refundDate DATETIME DEFAULT GETDATE(),
    refundAmount DECIMAL(10,2) NOT NULL,
    refundStatus VARCHAR(50) DEFAULT 'Processed',
    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId)
);

ALTER TABLE Users ADD loyaltyPoints INT DEFAULT 0;
ALTER TABLE Booking add paymentMethod VARCHAR(50) DEFAULT 'Cash';
select* from Users

select* from Item
--select* from Refund


-- ===============================================
-- FIRST: ADD 5 INDIAN MOVIES (Hindi)
-- ===============================================

-- 54. Tu Jhoothi Main Makkaar
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Tu Jhoothi Main Makkaar', 160, '2023-03-08', 'UA', 'Hindi');
DECLARE @movie54 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie54, (SELECT genreId FROM Genre WHERE genreName='Romance')),
(@movie54, (SELECT genreId FROM Genre WHERE genreName='Comedy'));

-- 55. Selfiee
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Selfiee', 145, '2023-02-24', 'UA', 'Hindi');
DECLARE @movie55 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie55, (SELECT genreId FROM Genre WHERE genreName='Comedy')),
(@movie55, (SELECT genreId FROM Genre WHERE genreName='Drama'));

-- 56. Shehzada
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Shehzada', 141, '2023-02-17', 'UA', 'Hindi');
DECLARE @movie56 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie56, (SELECT genreId FROM Genre WHERE genreName='Action')),
(@movie56, (SELECT genreId FROM Genre WHERE genreName='Comedy'));

-- 57. Zara Hatke Zara Bachke
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Zara Hatke Zara Bachke', 132, '2023-06-02', 'UA', 'Hindi');
DECLARE @movie57 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie57, (SELECT genreId FROM Genre WHERE genreName='Romance')),
(@movie57, (SELECT genreId FROM Genre WHERE genreName='Comedy'));

-- ===============================================
-- ADD 5 PAKISTANI MOVIES (Urdu)
-- ===============================================

-- 58. Intezaar
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Intezaar', 130, '2023-07-14', 'PG', 'Urdu');
DECLARE @movie58 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie58, (SELECT genreId FROM Genre WHERE genreName='Romance')),
(@movie58, (SELECT genreId FROM Genre WHERE genreName='Drama'));

-- 59. Money Back Guarantee
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Money Back Guarantee', 148, '2023-04-21', 'PG', 'Urdu');
DECLARE @movie59 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie59, (SELECT genreId FROM Genre WHERE genreName='Comedy')),
(@movie59, (SELECT genreId FROM Genre WHERE genreName='Action'));

-- 60. Babylicious
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Babylicious', 125, '2023-08-11', 'PG', 'Urdu');
DECLARE @movie60 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie60, (SELECT genreId FROM Genre WHERE genreName='Comedy')),
(@movie60, (SELECT genreId FROM Genre WHERE genreName='Romance'));

-- 61. Tich Button
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Tich Button', 142, '2022-11-11', 'PG', 'Urdu');
DECLARE @movie61 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie61, (SELECT genreId FROM Genre WHERE genreName='Romance')),
(@movie61, (SELECT genreId FROM Genre WHERE genreName='Comedy'));

-- 62. Kamli
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Kamli', 115, '2022-06-03', 'PG', 'Urdu');
DECLARE @movie62 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie62, (SELECT genreId FROM Genre WHERE genreName='Drama')),
(@movie62, (SELECT genreId FROM Genre WHERE genreName='Musical'));

-- ===============================================
-- ADD 5 ENGLISH MOVIES
-- ===============================================

-- 63. Avatar: The Way of Water
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Avatar: The Way of Water', 192, '2022-12-16', 'PG-13', 'English');
DECLARE @movie63 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie63, (SELECT genreId FROM Genre WHERE genreName='Action')),
(@movie63, (SELECT genreId FROM Genre WHERE genreName='Sci-Fi'));

-- 64. Spider-Man: Across the Spider-Verse
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Spider-Man: Across the Spider-Verse', 140, '2023-06-02', 'PG', 'English');
DECLARE @movie64 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie64, (SELECT genreId FROM Genre WHERE genreName='Action')),
(@movie64, (SELECT genreId FROM Genre WHERE genreName='Comedy'));

-- 65. Guardians of the Galaxy Vol. 3
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Guardians of the Galaxy Vol. 3', 150, '2023-05-05', 'PG-13', 'English');
DECLARE @movie65 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie65, (SELECT genreId FROM Genre WHERE genreName='Action')),
(@movie65, (SELECT genreId FROM Genre WHERE genreName='Sci-Fi'));

-- 66. Indiana Jones and the Dial of Destiny
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Indiana Jones and the Dial of Destiny', 154, '2023-06-30', 'PG-13', 'English');
DECLARE @movie66 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie66, (SELECT genreId FROM Genre WHERE genreName='Action')),
(@movie66, (SELECT genreId FROM Genre WHERE genreName='Adventure'));

-- 67. The Little Mermaid
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('The Little Mermaid', 135, '2023-05-26', 'PG', 'English');
DECLARE @movie67 INT = SCOPE_IDENTITY();
INSERT INTO MovieGenre (movieId, genreId) VALUES 
(@movie67, (SELECT genreId FROM Genre WHERE genreName='Musical')),
(@movie67, (SELECT genreId FROM Genre WHERE genreName='Romance'));

-- ===============================================
-- NOW ADD SHOWS USING THE VARIABLES
-- ===============================================

-- Tu Jhoothi Main Makkaar (movie54)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie54, 2, '2025-07-01', '10:00', '12:40', 0),
(@movie54, 2, '2025-07-01', '14:00', '16:40', 0),
(@movie54, 2, '2025-07-01', '18:00', '20:40', 0),
(@movie54, 2, '2025-07-02', '11:00', '13:40', 0),
(@movie54, 2, '2025-07-02', '16:00', '18:40', 0);

-- Selfiee (movie55)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie55, 2, '2025-07-03', '10:30', '12:55', 0),
(@movie55, 2, '2025-07-03', '14:30', '16:55', 0),
(@movie55, 2, '2025-07-03', '18:30', '20:55', 0),
(@movie55, 2, '2025-07-04', '12:00', '14:25', 0),
(@movie55, 2, '2025-07-04', '17:00', '19:25', 0);

-- Shehzada (movie56)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie56, 2, '2025-07-05', '09:00', '11:21', 0),
(@movie56, 2, '2025-07-05', '13:00', '15:21', 0),
(@movie56, 2, '2025-07-05', '17:00', '19:21', 0),
(@movie56, 2, '2025-07-05', '20:30', '22:51', 0);

-- Zara Hatke Zara Bachke (movie57)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie57, 2, '2025-07-06', '10:00', '12:12', 0),
(@movie57, 2, '2025-07-06', '13:30', '15:42', 0),
(@movie57, 2, '2025-07-06', '17:00', '19:12', 0),
(@movie57, 2, '2025-07-06', '20:00', '22:12', 0);

-- Intezaar (movie58)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie58, 2, '2025-07-09', '10:00', '12:10', 0),
(@movie58, 2, '2025-07-09', '13:30', '15:40', 0),
(@movie58, 2, '2025-07-09', '17:00', '19:10', 0),
(@movie58, 2, '2025-07-10', '11:00', '13:10', 0),
(@movie58, 2, '2025-07-10', '15:30', '17:40', 0);

-- Money Back Guarantee (movie59)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie59, 1, '2025-07-11', '10:00', '12:28', 0),
(@movie59, 1, '2025-07-11', '14:00', '16:28', 0),
(@movie59, 1, '2025-07-11', '18:00', '20:28', 0),
(@movie59, 2, '2025-07-12', '12:00', '14:28', 0),
(@movie59, 2, '2025-07-12', '17:00', '19:28', 0);

-- Babylicious (movie60)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie60, 2, '2025-07-13', '09:30', '11:35', 0),
(@movie60, 2, '2025-07-13', '12:30', '14:35', 0),
(@movie60, 2, '2025-07-13', '15:30', '17:35', 0),
(@movie60, 2, '2025-07-13', '18:30', '20:35', 0),
(@movie60, 2, '2025-07-14', '11:00', '13:05', 0),
(@movie60, 2, '2025-07-14', '16:00', '18:05', 0);

-- Tich Button (movie61)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie61, 2, '2025-07-15', '10:00', '12:22', 0),
(@movie61, 2, '2025-07-15', '13:30', '15:52', 0),
(@movie61, 2, '2025-07-15', '17:00', '19:22', 0),
(@movie61, 2, '2025-07-16', '14:00', '16:22', 0),
(@movie61, 2, '2025-07-16', '19:00', '21:22', 0);

-- Kamli (movie62)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie62, 2, '2025-07-17', '10:00', '11:55', 0),
(@movie62, 2, '2025-07-17', '13:00', '14:55', 0),
(@movie62, 2, '2025-07-17', '16:00', '17:55', 0),
(@movie62, 2, '2025-07-17', '19:00', '20:55', 0),
(@movie62, 2, '2025-07-18', '11:30', '13:25', 0),
(@movie62, 2, '2025-07-18', '15:30', '17:25', 0);

-- Avatar: The Way of Water (movie63)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie63, 1, '2025-07-19', '10:00', '13:12', 0),
(@movie63, 1, '2025-07-19', '14:30', '17:42', 0),
(@movie63, 1, '2025-07-19', '19:00', '22:12', 0),
(@movie63, 1, '2025-07-20', '11:00', '14:12', 0),
(@movie63, 1, '2025-07-20', '16:00', '19:12', 0),
(@movie63, 1, '2025-07-20', '20:30', '23:42', 0);

-- Spider-Man (movie64)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie64, 1, '2025-07-21', '10:00', '12:20', 0),
(@movie64, 1, '2025-07-21', '13:30', '15:50', 0),
(@movie64, 1, '2025-07-21', '17:00', '19:20', 0),
(@movie64, 2, '2025-07-22', '10:30', '12:50', 0),
(@movie64, 2, '2025-07-22', '14:00', '16:20', 0),
(@movie64, 2, '2025-07-22', '18:00', '20:20', 0);

-- Guardians of the Galaxy (movie65)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie65, 1, '2025-07-23', '10:30', '13:00', 0),
(@movie65, 1, '2025-07-23', '14:30', '17:00', 0),
(@movie65, 1, '2025-07-23', '18:30', '21:00', 0),
(@movie65, 2, '2025-07-24', '11:00', '13:30', 0),
(@movie65, 2, '2025-07-24', '15:30', '18:00', 0),
(@movie65, 2, '2025-07-24', '19:30', '22:00', 0);

-- Indiana Jones (movie66)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie66, 1, '2025-07-25', '10:00', '12:34', 0),
(@movie66, 1, '2025-07-25', '14:00', '16:34', 0),
(@movie66, 1, '2025-07-25', '18:00', '20:34', 0),
(@movie66, 2, '2025-07-26', '12:00', '14:34', 0),
(@movie66, 2, '2025-07-26', '16:30', '19:04', 0);

-- The Little Mermaid (movie67)
INSERT INTO ShowTable (movieId, screenId, showDate, startTime, endTime, isCancelled)
VALUES 
(@movie67, 2, '2025-07-27', '09:00', '11:15', 0),
(@movie67, 2, '2025-07-27', '12:00', '14:15', 0),
(@movie67, 2, '2025-07-27', '15:00', '17:15', 0),
(@movie67, 2, '2025-07-27', '18:00', '20:15', 0),
(@movie67, 2, '2025-07-28', '10:30', '12:45', 0),
(@movie67, 2, '2025-07-28', '14:30', '16:45', 0),
(@movie67, 2, '2025-07-28', '19:00', '21:15', 0);

-- ===============================================
-- VERIFY
-- ===============================================
SELECT 
    m.title, 
    m.language, 
    COUNT(sh.showId) AS ShowCount
FROM Movie m
LEFT JOIN ShowTable sh ON m.movieId = sh.movieId
WHERE m.movieId >= 54
GROUP BY m.title, m.language
ORDER BY m.language;

-- 18. Feedback Table
CREATE TABLE Feedback (
    feedbackId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments NVARCHAR(MAX),
    submitted_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);



-- Check if columns exist
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users';

-- If 'email' shows up in the list above, run this:
UPDATE Users SET isAdmin = 1 WHERE email = 'admin@123'; 
select* from Feedback

--select*from Users
--update Users
--set name='Maria' where id=1


--select*from Users
--update Users
--set isAdmin=0 where id=1


--update Users
--set email='maria@123' where id=1


--select* from Feedback


-- ===============================================================
-- ACADEMIC REQUIREMENTS: VIEWS, STORED PROCEDURES, TRIGGERS
-- ===============================================================

GO

-- ---------------------------------------------------------------
-- 1. VIEWS
-- ---------------------------------------------------------------

-- View 1: vw_ShowtimeDetails
-- Simplifies complex joins to easily see show schedules
CREATE VIEW vw_ShowtimeDetails AS
SELECT 
    s.showId,
    m.title AS MovieTitle,
    c.name AS CinemaName,
    st.typeName AS ScreenType,
    s.showDate,
    s.startTime,
    s.endTime,
    s.isCancelled
FROM ShowTable s
JOIN Movie m ON s.movieId = m.movieId
JOIN Screen sc ON s.screenId = sc.screenId
JOIN Cinema c ON sc.cinemaId = c.cinemaId
JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId;
GO

-- View 2: vw_MovieGenres
-- Easily see movies with their text genre instead of IDs
CREATE VIEW vw_MovieGenres AS
SELECT 
    m.movieId,
    m.title,
    m.language,
    g.genreName
FROM Movie m
JOIN MovieGenre mg ON m.movieId = mg.movieId
JOIN Genre g ON mg.genreId = g.genreId;
GO

-- ---------------------------------------------------------------
-- 2. STORED PROCEDURES
-- ---------------------------------------------------------------

-- Procedure 1: sp_GetAvailableSeats
-- Calculates available seats for a specific show by excluding booked ones
CREATE PROCEDURE sp_GetAvailableSeats
    @ShowId INT
AS
BEGIN
    SELECT s.seatId, s.seatNo, s.rowNo, st.category, st.priceSeat
    FROM Seat s
    JOIN SeatType st ON s.seatTypeId = st.seatTypeId
    JOIN ShowTable sh ON s.screenId = sh.screenId
    WHERE sh.showId = @ShowId
    AND s.seatId NOT IN (
        SELECT bs.seatId 
        FROM BookingSeat bs 
        JOIN Booking b ON bs.bookingId = b.bookingId 
        WHERE b.showId = @ShowId AND b.bookingStatus = 1
    );
END;
GO

-- Procedure 2: sp_CancelBooking
-- Safely cancels a booking and inserts a record into Refund table
CREATE PROCEDURE sp_CancelBooking
    @BookingId INT,
    @RefundAmount DECIMAL(10,2)
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Mark booking as cancelled (status 0)
        UPDATE Booking
        SET bookingStatus = 0
        WHERE bookingId = @BookingId;

        -- Insert refund record
        INSERT INTO Refund (bookingId, refundDate, refundAmount, refundStatus)
        VALUES (@BookingId, GETDATE(), @RefundAmount, 'Processed');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ---------------------------------------------------------------
-- 3. TRIGGERS
-- ---------------------------------------------------------------

-- Trigger 1: trg_AddLoyaltyPoints
-- Automatically adds loyalty points to a user when a booking is made
CREATE TRIGGER trg_AddLoyaltyPoints
ON Booking
AFTER INSERT
AS
BEGIN
    -- Add 10 points for every new booking
    UPDATE Users
    SET loyaltyPoints = ISNULL(loyaltyPoints, 0) + 10
    FROM Users U
    INNER JOIN inserted I ON U.id = I.userId
    WHERE I.bookingStatus = 1;
END;
GO

-- Trigger 2: trg_CheckShowtimeOverlap
-- Prevents scheduling a show on a screen if times overlap
CREATE TRIGGER trg_CheckShowtimeOverlap
ON ShowTable
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM ShowTable s
        JOIN inserted i ON s.screenId = i.screenId AND s.showDate = i.showDate
        WHERE s.showId != i.showId 
        AND s.isCancelled = 0 AND i.isCancelled = 0
        AND (
            (i.startTime >= s.startTime AND i.startTime < s.endTime) OR
            (i.endTime > s.startTime AND i.endTime <= s.endTime) OR
            (i.startTime <= s.startTime AND i.endTime >= s.endTime)
        )
    )
    BEGIN
        RAISERROR ('Showtime overlaps with an existing show on this screen.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO
