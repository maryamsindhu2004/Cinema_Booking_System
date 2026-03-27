const { getConnection } = require('./db');

async function initDb() {
    try {
        const pool = await getConnection();
        
        // Create Users table if it doesn't exist
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
        console.log('✅ Database Initialization confirmed.');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
    }
}

module.exports = initDb;
