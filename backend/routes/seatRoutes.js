const express = require("express");
const router = express.Router();
const getPool = require("../db");

/*
GET /seats/:show_id
returns:
- all seats
- booked seats
*/

router.get("/:show_id", async (req, res) => {
    try {
        const pool = await getPool();
        const show_id = req.params.show_id;

        // Get all seats for the screen associated with this show
        const seats = await pool.request().query(`
            SELECT s.seat_id, s.seat_no, s.row_no
            FROM Seats s
            JOIN Shows sh ON s.screen_id = sh.screen_id
            WHERE sh.show_id = ${show_id}
        `);

        // Get already booked seats for this show
        const booked = await pool.request().query(`
            SELECT bs.seat_id
            FROM BookingSeats bs
            JOIN Bookings b ON bs.booking_id = b.booking_id
            WHERE b.show_id = ${show_id}
        `);

        res.json({
            seats: seats.recordset,
            booked: booked.recordset.map(s => s.seat_id)
        });

    } catch (err) {
        console.error("Error loading seats:", err);
        res.status(500).send("Error loading seats: " + err.message);
    }
});

module.exports = router;
