const { connectDB } = require("./db");

async function test() {
    try {
        console.log("Connecting...");
        const pool = await connectDB();
        console.log("Connected. Querying...");
        const result = await pool.request().query("SELECT * FROM Movies");
        console.log("Success! Rows:", result.recordset.length);
        process.exit(0);
    } catch (err) {
        console.error("FAILED:", err);
        process.exit(1);
    }
}

test();
