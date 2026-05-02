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

        const seats = await pool.request().query(`
            SELECT s.seat_id, s.seat_no
            FROM Seats s
        `);

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
        console.error(err);
        res.status(500).send("Error loading seats");
    }
});

module.exports = router;
