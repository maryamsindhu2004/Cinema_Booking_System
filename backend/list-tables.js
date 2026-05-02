const { connectDB } = require("./db");

async function listTables() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        console.log("Tables:", result.recordset.map(r => r.TABLE_NAME));
        process.exit(0);
    } catch (err) {
        console.error("FAILED:", err);
        process.exit(1);
    }
}

listTables();
