const sql = require("mssql");

const config = {
    user: "node_user",
    password: "yourpassword123",
    server: "localhost",
    port: 1433,
    database: "CinemaBookingDB",
    options: {
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

let pool;

async function connectDB() {
    if (!pool) {
        pool = await sql.connect(config);
        console.log("✅ Connected to SQL Server");
    }
    return pool;
}

// Support both function-style and object-style imports
connectDB.connectDB = connectDB;
connectDB.sql = sql;

module.exports = connectDB;

