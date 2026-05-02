const express = require("express");
const router = express.Router();
const getPool = require("../db");


// ✅ GET ALL MOVIES
router.get("/", async (req, res) => {
  try {
    console.log("GET /movies requested");
    const pool = await getPool();
    console.log("Pool acquired, executing query...");
    const result = await pool.request().query(`
            SELECT * FROM Movies
        `);
    console.log("Query success. Rows returned:", result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching movies:", err);
    res.status(500).send("Error fetching movies: " + err.message);
  }
});



// ✅ DEBUG DB ROUTE
router.get("/debug-db", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
            SELECT 
                DB_NAME() AS current_db,
                @@SERVERNAME AS server_name
        `);

    res.json(result.recordset);

  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).send("Debug error");
  }
});

module.exports = router;
