const { getConnection } = require('./db');
const bcrypt = require('bcryptjs');

async function runMigration() {
    try {
        const pool = await getConnection();

        console.log("Adding role column to Users table...");
        try {
            await pool.request().query(`
                ALTER TABLE Users ADD role NVARCHAR(20) DEFAULT 'customer'
            `);
            console.log("✅ 'role' column added to Users table");
        } catch (e) {
            if (e.message.includes('already has')) {
                console.log("⚠️ 'role' column already exists, skipping ADD");
            } else {
                throw e;
            }
        }

        console.log("Setting up Admin user...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        const adminEmail = 'admin'; // Specific requested username/email
        const adminName = 'Admin User';

        // Check if admin exists
        const check = await pool.request()
            .input('email', adminEmail)
            .query('SELECT * FROM Users WHERE email = @email');

        if (check.recordset.length > 0) {
            console.log("Admin user exists! Updating role and password...");
            await pool.request()
                .input('email', adminEmail)
                .input('password', hashedPassword)
                .query(`
                    UPDATE Users 
                    SET role = 'owner', password_hash = @password
                    WHERE email = @email
                `);
            console.log("✅ Admin user updated");
        } else {
            console.log("Admin user not found. Creating new admin...");
            await pool.request()
                .input('name', adminName)
                .input('email', adminEmail)
                .input('password', hashedPassword)
                .query(`
                    INSERT INTO Users (name, email, password_hash, role)
                    VALUES (@name, @email, @password, 'owner')
                `);
            console.log("✅ Admin user created");
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

runMigration();
