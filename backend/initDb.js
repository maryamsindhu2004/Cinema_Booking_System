const { getConnection } = require('./db');

async function initDb() {
    try {
        const pool = await getConnection();
        console.log('🚀 Initializing Full Database Schema...');

        // 1. Users table (Aligned with DB schema check + password for Auth)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            BEGIN
                CREATE TABLE Users (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(200) NOT NULL,
                    email NVARCHAR(200) UNIQUE NOT NULL,
                    password_hash NVARCHAR(510) NOT NULL,
                    phoneNo NVARCHAR(40),
                    created_at DATETIME DEFAULT GETDATE()
                );
            END
        `);

        // 2. Cinema Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Cinema' AND xtype='U')
            BEGIN
                CREATE TABLE Cinema (
                    cinemaId INT PRIMARY KEY IDENTITY(1,1),
                    name VARCHAR(255) NOT NULL,
                    location VARCHAR(MAX) NOT NULL,
                    contact VARCHAR(50),
                    openingTime TIME,
                    closingTime TIME,
                    isActive BIT DEFAULT 1
                )
            END
        `);

        // 3. ScreenType Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ScreenType' AND xtype='U')
            BEGIN
                CREATE TABLE ScreenType (
                    screenTypeId INT PRIMARY KEY IDENTITY(1,1),
                    typeName VARCHAR(100) NOT NULL,
                    description VARCHAR(MAX),
                    priceScreen DECIMAL(10,2) CHECK (priceScreen >= 0)
                )
            END
        `);

        // 4. Screen Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Screen' AND xtype='U')
            BEGIN
                CREATE TABLE Screen (
                    screenId INT PRIMARY KEY IDENTITY(1,1),
                    cinemaId INT NOT NULL,
                    screenTypeId INT NOT NULL,
                    totalSeats INT CHECK (totalSeats > 0),
                    isActive BIT DEFAULT 1,
                    FOREIGN KEY (cinemaId) REFERENCES Cinema(cinemaId) ON DELETE CASCADE,
                    FOREIGN KEY (screenTypeId) REFERENCES ScreenType(screenTypeId)
                )
            END
        `);

        // 5. SeatType Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SeatType' AND xtype='U')
            BEGIN
                CREATE TABLE SeatType (
                    seatTypeId INT PRIMARY KEY IDENTITY(1,1),
                    category VARCHAR(100) NOT NULL,
                    priceSeat DECIMAL(10,2) CHECK (priceSeat >= 0)
                )
            END
        `);

        // 6. Seat Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Seat' AND xtype='U')
            BEGIN
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
                )
            END
        `);

        // 7. Movie (BCNF Refactor)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Movie' AND xtype='U')
            BEGIN
                CREATE TABLE Movie (
                    movieId INT PRIMARY KEY IDENTITY(1,1),
                    title VARCHAR(255) NOT NULL,
                    duration INT CHECK (duration > 0),
                    releaseDate DATE,
                    rating VARCHAR(10),
                    language VARCHAR(50)
                );
            END
            ELSE IF COL_LENGTH('Movie', 'genre') IS NOT NULL
            BEGIN
                -- Drop constraints that might block the drop
                DECLARE @ConstraintName nvarchar(200)
                SELECT @ConstraintName = Name FROM SYS.DEFAULT_CONSTRAINTS WHERE PARENT_OBJECT_ID = OBJECT_ID('Movie') AND PARENT_COLUMN_ID = (SELECT column_id FROM sys.columns WHERE name = 'genre' AND object_id = OBJECT_ID('Movie'))
                IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE Movie DROP CONSTRAINT ' + @ConstraintName)
                
                ALTER TABLE Movie DROP COLUMN genre;
            END
        `);

        // 7a. Genre Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Genre' AND xtype='U')
            BEGIN
                CREATE TABLE Genre (
                    genreId INT PRIMARY KEY IDENTITY(1,1),
                    genreName VARCHAR(50) UNIQUE NOT NULL
                );
            END
        `);

        // 7b. MovieGenre Mapping
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MovieGenre' AND xtype='U')
            BEGIN
                CREATE TABLE MovieGenre (
                    movieId INT NOT NULL,
                    genreId INT NOT NULL,
                    PRIMARY KEY (movieId, genreId),
                    FOREIGN KEY (movieId) REFERENCES Movie(movieId) ON DELETE CASCADE,
                    FOREIGN KEY (genreId) REFERENCES Genre(genreId) ON DELETE CASCADE
                );
            END
        `);

        // 8. ShowTable
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ShowTable' AND xtype='U')
            BEGIN
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
                )
            END
        `);

        // 9. Booking
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Booking' AND xtype='U')
            BEGIN
                CREATE TABLE Booking (
                    bookingId INT PRIMARY KEY IDENTITY(1,1),
                    userId INT NOT NULL,
                    showId INT NOT NULL,
                    bookingDate DATETIME DEFAULT GETDATE(),
                    bookingStatus BIT DEFAULT 1,
                    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
                    FOREIGN KEY (showId) REFERENCES ShowTable(showId)
                );
            END
        `);

        // 9a. BookingSeat (BCNF)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BookingSeat' AND xtype='U')
            BEGIN
                CREATE TABLE BookingSeat (
                    bookingId INT NOT NULL,
                    seatId INT NOT NULL,
                    PRIMARY KEY (bookingId, seatId),
                    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE,
                    FOREIGN KEY (seatId) REFERENCES Seat(seatId)
                );
            END
        `);

        // 10. Payment Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Payment' AND xtype='U')
            BEGIN
                CREATE TABLE Payment (
                    paymentId INT PRIMARY KEY IDENTITY(1,1),
                    bookingId INT NOT NULL,
                    paymentMethod VARCHAR(50) NOT NULL,
                    paymentDate DATETIME DEFAULT GETDATE(),
                    refundAmount DECIMAL(10,2) DEFAULT 0 CHECK (refundAmount >= 0),
                    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE
                )
            END
        `);

        // 11. Item Table (BCNF)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Item' AND xtype='U')
            BEGIN
                CREATE TABLE Item (
                    itemId INT PRIMARY KEY IDENTITY(1,1),
                    itemName VARCHAR(100) NOT NULL,
                    basePrice DECIMAL(10,2) NOT NULL CHECK (basePrice >= 0)
                );
            END
        `);

        // 12. FoodOrder
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FoodOrder' AND xtype='U')
            BEGIN
                CREATE TABLE FoodOrder (
                    foodOrderId INT PRIMARY KEY IDENTITY(1,1),
                    bookingId INT NOT NULL,
                    orderDate DATETIME DEFAULT GETDATE(),
                    totalAmount DECIMAL(10,2) DEFAULT 0 CHECK (totalAmount >= 0),
                    FOREIGN KEY (bookingId) REFERENCES Booking(bookingId) ON DELETE CASCADE
                );
            END
        `);

        // 13. FoodOrderDetail (BCNF Refactor)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FoodOrderDetail' AND xtype='U')
            BEGIN
                CREATE TABLE FoodOrderDetail (
                    foodOrderId INT NOT NULL,
                    itemId INT NOT NULL,
                    quantity INT CHECK (quantity > 0),
                    PRIMARY KEY (foodOrderId, itemId),
                    FOREIGN KEY (foodOrderId) REFERENCES FoodOrder(foodOrderId) ON DELETE CASCADE,
                    FOREIGN KEY (itemId) REFERENCES Item(itemId)
                );
            END
            ELSE IF COL_LENGTH('FoodOrderDetail', 'itemPrice') IS NOT NULL
            BEGIN
                -- Drop check constraints referencing itemPrice
                DECLARE @CheckConstraint nvarchar(200)
                SELECT TOP 1 @CheckConstraint = name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('FoodOrderDetail') AND definition LIKE '%itemPrice%'
                WHILE @CheckConstraint IS NOT NULL
                BEGIN
                    EXEC('ALTER TABLE FoodOrderDetail DROP CONSTRAINT ' + @CheckConstraint)
                    SET @CheckConstraint = NULL
                    SELECT TOP 1 @CheckConstraint = name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('FoodOrderDetail') AND definition LIKE '%itemPrice%'
                END

                -- Drop default constraints
                DECLARE @DefConstraint nvarchar(200)
                SELECT @DefConstraint = Name FROM SYS.DEFAULT_CONSTRAINTS WHERE PARENT_OBJECT_ID = OBJECT_ID('FoodOrderDetail') AND PARENT_COLUMN_ID = (SELECT column_id FROM sys.columns WHERE name = 'itemPrice' AND object_id = OBJECT_ID('FoodOrderDetail'))
                IF @DefConstraint IS NOT NULL EXEC('ALTER TABLE FoodOrderDetail DROP CONSTRAINT ' + @DefConstraint)

                ALTER TABLE FoodOrderDetail DROP COLUMN itemPrice;
            END
        `);

        // 13. Discount Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Discount' AND xtype='U')
            BEGIN
                CREATE TABLE Discount (
                    discountId INT PRIMARY KEY IDENTITY(1,1),
                    discountCode VARCHAR(50) UNIQUE NOT NULL,
                    discountType VARCHAR(20) CHECK (discountType IN ('PERCENTAGE','FIXED')),
                    discountValue DECIMAL(10,2) CHECK (discountValue >= 0),
                    validFrom DATE,
                    validTo DATE,
                    applicableDays VARCHAR(50),
                    isActive BIT DEFAULT 1
                )
            END
        `);

        console.log('✅ All tables synchronized successfully.');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
    }
}

module.exports = initDb;

