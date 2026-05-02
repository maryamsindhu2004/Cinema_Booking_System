const express = require("express");
const router = express.Router();
const getPool = require("../db");

router.get("/items", async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT * FROM ConcessionItems
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching food");
    }
});

module.exports = router;
