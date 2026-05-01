const { getConnection } = require('./db');

async function initDb() {
    try {
        const pool = await getConnection();
        console.log('🔄 Initializing Database Schema...');

        // AUTO-FIX: Add loyaltyPoints column if it doesn't exist
        try {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'loyaltyPoints')
                BEGIN
                    ALTER TABLE Users ADD loyaltyPoints INT DEFAULT 0
                END
                -- Ensure existing users have 0 instead of NULL
                UPDATE Users SET loyaltyPoints = 0 WHERE loyaltyPoints IS NULL

                -- AUTO-FIX: Add paymentMethod to Booking
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Booking') AND name = 'paymentMethod')
                BEGIN
                    ALTER TABLE Booking ADD paymentMethod VARCHAR(50) DEFAULT 'Cash'
                END

                -- AUTO-FIX: Add needsWheelchair to Booking
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Booking') AND name = 'needsWheelchair')
                BEGIN
                    ALTER TABLE Booking ADD needsWheelchair BIT DEFAULT 0
                END
            `);
            console.log('✅ Loyalty system verified.');
        } catch (e) { console.error('Points verify error:', e.message); }

        const tables = [
            { name: 'Users', query: `CREATE TABLE Users (id INT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(200) NOT NULL, email NVARCHAR(200) UNIQUE NOT NULL, password_hash NVARCHAR(510) NOT NULL, phoneNo NVARCHAR(40), loyaltyPoints INT DEFAULT 0, created_at DATETIME DEFAULT GETDATE())` },
            { name: 'Cinema', query: `CREATE TABLE Cinema (cinemaId INT PRIMARY KEY IDENTITY(1,1), name VARCHAR(255) NOT NULL, location VARCHAR(MAX) NOT NULL, contact VARCHAR(50), openingTime TIME, closingTime TIME, isActive BIT DEFAULT 1)` },
            { name: 'ScreenType', query: `CREATE TABLE ScreenType (screenTypeId INT PRIMARY KEY IDENTITY(1,1), typeName VARCHAR(100) NOT NULL, description VARCHAR(MAX), priceScreen DECIMAL(10,2) CHECK (priceScreen >= 0))` },
            { name: 'Screen', query: `CREATE TABLE Screen (screenId INT PRIMARY KEY IDENTITY(1,1), cinemaId INT NOT NULL, screenTypeId INT NOT NULL, totalSeats INT CHECK (totalSeats > 0), isActive BIT DEFAULT 1, FOREIGN KEY (cinemaId) REFERENCES Cinema(cinemaId) ON DELETE CASCADE, FOREIGN KEY (screenTypeId) REFERENCES ScreenType(screenTypeId))` },
            { name: 'SeatType', query: `CREATE TABLE SeatType (seatTypeId INT PRIMARY KEY IDENTITY(1,1), category VARCHAR(100) NOT NULL, priceSeat DECIMAL(10,2) CHECK (priceSeat >= 0))` },
            { name: 'Seat', query: `CREATE TABLE Seat (seatId INT PRIMARY KEY IDENTITY(1,1), screenId INT NOT NULL, seatTypeId INT NOT NULL, seatNo VARCHAR(10) NOT NULL, rowNo VARCHAR(5), isActive BIT DEFAULT 1, isWheelchairAllow BIT DEFAULT 0, FOREIGN KEY (screenId) REFERENCES Screen(screenId) ON DELETE CASCADE, FOREIGN KEY (seatTypeId) REFERENCES SeatType(seatTypeId))` },
            { name: 'Movie', query: `CREATE TABLE Movie (movieId INT PRIMARY KEY IDENTITY(1,1), title VARCHAR(255) NOT NULL, duration INT CHECK (duration > 0), releaseDate DATE, rating VARCHAR(10), language VARCHAR(50))` },
            { name: 'Genre', query: `CREATE TABLE Genre (genreId INT PRIMARY KEY IDENTITY(1,1), genreName VARCHAR(50) UNIQUE NOT NULL)` },
            { name: 'MovieGenre', query: `CREATE TABLE MovieGenre (movieId INT NOT NULL, genreId INT NOT NULL, PRIMARY KEY (movieId, genreId), FOREIGN KEY (movieId) REFERENCES Movie(movieId) ON DELETE CASCADE, FOREIGN KEY (genreId) REFERENCES Genre(genreId) ON DELETE CASCADE)` },
            { name: 'ShowTable', query: `CREATE TABLE ShowTable (showId INT PRIMARY KEY IDENTITY(1,1), movieId INT NOT NULL, screenId INT NOT NULL, showDate DATE NOT NULL, startTime TIME NOT NULL, endTime TIME NOT NULL, isCancelled BIT DEFAULT 0, FOREIGN KEY (movieId) REFERENCES Movie(movieId), FOREIGN KEY (screenId) REFERENCES Screen(screenId) ON DELETE CASCADE)` },
            { name: 'Booking', query: `CREATE TABLE Booking (bookingId INT PRIMARY KEY IDENTITY(1,1), userId INT NOT NULL, showId INT NOT NULL, bookingDate DATETIME DEFAULT GETDATE(), bookingStatus BIT DEFAULT 1, FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE, FOREIGN KEY (showId) REFERENCES ShowTable(showId))` },
            { name: 'BookingSeat', query: `CREATE TABLE BookingSeat (bookingId INT NOT NULL, seatId INT NOT NULL, PRIMARY KEY (bookingId, seatId), FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE, FOREIGN KEY (seatId) REFERENCES Seat(seatId))` },
            { name: 'Item', query: `CREATE TABLE Item (itemId INT PRIMARY KEY IDENTITY(1,1), itemName VARCHAR(100) NOT NULL, basePrice DECIMAL(10,2) NOT NULL CHECK (basePrice >= 0))` },
            { name: 'FoodOrder', query: `CREATE TABLE FoodOrder (foodOrderId INT PRIMARY KEY IDENTITY(1,1), bookingId INT NOT NULL, orderDate DATETIME DEFAULT GETDATE(), totalAmount DECIMAL(10,2) DEFAULT 0 CHECK (totalAmount >= 0), FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE)` },
            { name: 'FoodOrderDetail', query: `CREATE TABLE FoodOrderDetail (foodOrderId INT NOT NULL, itemId INT NOT NULL, quantity INT CHECK (quantity > 0), PRIMARY KEY (foodOrderId, itemId), FOREIGN KEY (foodOrderId) REFERENCES FoodOrder(foodOrderId) ON DELETE CASCADE, FOREIGN KEY (itemId) REFERENCES Item(itemId))` },
            { name: 'Discount', query: `CREATE TABLE Discount (discountId INT PRIMARY KEY IDENTITY(1,1), discountCode VARCHAR(50) UNIQUE NOT NULL, discountType VARCHAR(20) CHECK (discountType IN ('PERCENTAGE','FIXED')), discountValue DECIMAL(10,2) CHECK (discountValue >= 0), validFrom DATE, validTo DATE, applicableDays VARCHAR(50), isActive BIT DEFAULT 1)` },
            { name: 'Refund', query: `CREATE TABLE Refund (refundId INT PRIMARY KEY IDENTITY(1,1), bookingId INT NOT NULL, refundDate DATETIME DEFAULT GETDATE(), refundAmount DECIMAL(10,2) NOT NULL, refundStatus VARCHAR(50) DEFAULT 'Processed', FOREIGN KEY (bookingId) REFERENCES Booking(bookingId))` }
        ];

        for (const table of tables) {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${table.name}')
                BEGIN
                    ${table.query}
                    PRINT '✅ Table ${table.name} created.'
                END
            `);
        }

        // Ensure Small Popcorn & Nachos exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM Item WHERE itemName = 'Small Popcorn')
                INSERT INTO Item (itemName, basePrice) VALUES ('Small Popcorn', 250.00)
            IF NOT EXISTS (SELECT * FROM Item WHERE itemName = 'Nachos')
                INSERT INTO Item (itemName, basePrice) VALUES ('Nachos', 450.00)
        `);

        console.log('✅ Database Schema Synchronized Successfully!');
    } catch (error) {
        console.error('❌ Database Init Error:', error.message);
    }
}

module.exports = initDb;
