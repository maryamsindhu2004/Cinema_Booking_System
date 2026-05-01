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

-- Insert Movie: Mission Impossible
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Mission Impossible – Dead Reckoning', 163, '2023-07-12', 'PG-13', 'English');
INSERT INTO MovieGenre (movieId, genreId) VALUES (SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Action'));

-- Insert Movie: Oppenheimer
INSERT INTO Movie (title, duration, releaseDate, rating, language) 
VALUES ('Oppenheimer', 180, '2023-07-21', 'R', 'English');
INSERT INTO MovieGenre (movieId, genreId) VALUES (SCOPE_IDENTITY(), (SELECT genreId FROM Genre WHERE genreName='Drama'));

-- Insert Items
INSERT INTO Item (itemName, basePrice) VALUES ('Popcorn Large', 500.00), ('Coke', 200.00), ('Nachos', 450.00);

/* ===============================================================
   HOW TO ADD A NEW MOVIE (EXAMPLE)
   =============================================================== */
-- Step 1: Add the Movie
-- INSERT INTO Movie (title, duration, releaseDate, rating, language) VALUES ('Avatar 2', 192, '2022-12-16', 'PG-13', 'English');

-- Step 2: Get the ID and Link to Genre
-- DECLARE @newId INT = SCOPE_IDENTITY();
-- INSERT INTO MovieGenre (movieId, genreId) VALUES (@newId, (SELECT genreId FROM Genre WHERE genreName='Sci-Fi'));
