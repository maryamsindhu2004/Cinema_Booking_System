const { getConnection } = require('./db');

async function initDb() {
    try {
        const pool = await getConnection();
        
        console.log('Initializing database tables...');

        // 1. Users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            BEGIN
                CREATE TABLE Users (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(100) NOT NULL,
                    email NVARCHAR(100) UNIQUE NOT NULL,
                    password_hash NVARCHAR(255) NOT NULL,
                    created_at DATETIME DEFAULT GETDATE()
                )
                PRINT 'Users table created successfully'
            END
            ELSE
            BEGIN
                PRINT 'Users table already exists'
            END
        `);

        // 2. Movie table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Movie' AND xtype='U')
            BEGIN
                CREATE TABLE Movie (
                    movieId INT IDENTITY(1,1) PRIMARY KEY,
                    title NVARCHAR(255) NOT NULL,
                    duration INT,
                    genre NVARCHAR(50),
                    releaseDate DATE,
                    rating NVARCHAR(10),
                    language NVARCHAR(50)
                )
                PRINT 'Movie table created successfully'
            END
        `);

        console.log('✅ Database Initialization confirmed.');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
    }
}

module.exports = initDb;
