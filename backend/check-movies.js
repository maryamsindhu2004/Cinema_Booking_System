const { connectDB } = require("./db");

async function checkMovies() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT TOP 1 * FROM Movies");
        console.log("Movie Sample:", result.recordset[0]);
        process.exit(0);
    } catch (err) {
        console.error("FAILED:", err);
        process.exit(1);
    }
}

checkMovies();
