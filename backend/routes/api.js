const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');

// Helper to get pool
const getPool = async () => await getConnection();

// 1. ADD USER
router.post('/users', async (req, res) => {
    const { name, email, phoneNo } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('name', name)
            .input('email', email)
            .input('phoneNo', phoneNo)
            .query(`
                INSERT INTO [User] (name, email, phoneNo)
                VALUES (@name, @email, @phoneNo)
            `);
        res.json({ success: true, message: "User added" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Book Show
router.post('/booking', async (req, res) => {
    const { userId, showId } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('userId', userId)
            .input('showId', showId)
            .query(`
                INSERT INTO Booking (userId, showId)
                VALUES (@userId, @showId)
            `);
        res.json({ success: true, message: "Booking created" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Cancel Booking (DELETE)
router.delete('/booking/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', req.params.id)
            .query(`DELETE FROM Booking WHERE bookingId = @id`);
        res.json({ success: true, message: "Booking deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Update User
router.put('/users/:id', async (req, res) => {
    const { phoneNo } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('phoneNo', phoneNo)
            .input('id', req.params.id)
            .query(`
                UPDATE [User]
                SET phoneNo = @phoneNo
                WHERE userId = @id
            `);
        res.json({ success: true, message: "User updated" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. View All Movies
router.get('/movies', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`SELECT * FROM Movie`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Search Movie (LIKE)
router.get('/movies/search/:name', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('name', `%${req.params.name}%`)
            .query(`
                SELECT * FROM Movie
                WHERE title LIKE @name
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7. Movies by Genre
router.get('/movies/genre/:genre', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('genre', req.params.genre)
            .query(`SELECT * FROM Movie WHERE genre = @genre`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 8. Show Schedule (JOIN)
router.get('/shows', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT m.title, s.showDate, s.startTime
            FROM ShowTable s
            JOIN Movie m ON s.movieId = m.movieId
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 9. Booking Details
router.get('/bookings', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT u.name, b.bookingId, s.showDate
            FROM Booking b
            JOIN [User] u ON b.userId = u.userId
            JOIN ShowTable s ON b.showId = s.showId
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 10. Users without Bookings (LEFT JOIN)
router.get('/users/no-bookings', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT u.name
            FROM [User] u
            LEFT JOIN Booking b ON u.userId = b.userId
            WHERE b.bookingId IS NULL
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 11. Movies without Shows (RIGHT JOIN)
router.get('/movies/no-shows', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT m.title
            FROM ShowTable s
            RIGHT JOIN Movie m ON s.movieId = m.movieId
            WHERE s.showId IS NULL
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 12. Full Outer Join
router.get('/users-bookings-all', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT u.name, b.bookingId
            FROM [User] u
            FULL OUTER JOIN Booking b ON u.userId = b.userId
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 13. Total Bookings per Movie
router.get('/analytics/bookings-per-movie', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT m.title, COUNT(b.bookingId) AS totalBookings
            FROM Booking b
            JOIN ShowTable s ON b.showId = s.showId
            JOIN Movie m ON s.movieId = m.movieId
            GROUP BY m.title
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 14. Movies with >1 Booking (HAVING)
router.get('/analytics/popular-movies', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
             SELECT m.title, COUNT(b.bookingId) AS totalBookings
             FROM Booking b
             JOIN ShowTable s ON b.showId = s.showId
             JOIN Movie m ON s.movieId = m.movieId
             GROUP BY m.title
             HAVING COUNT(b.bookingId) > 1
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 15. Average Seat Price
router.get('/analytics/avg-seat-price', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
             SELECT AVG(priceSeat) AS avgPrice FROM SeatType
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 16. Sort Movies
router.get('/movies/sorted', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
             SELECT * FROM Movie ORDER BY releaseDate DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 17. UNION
router.get('/movies/union', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT title FROM Movie WHERE language = 'English'
            UNION
            SELECT title FROM Movie WHERE language = 'Hindi'
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 18. INTERSECT
router.get('/movies/intersect', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT title FROM Movie WHERE genre = 'Action'
            INTERSECT
            SELECT title FROM Movie WHERE language = 'Hindi'
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 19. EXCEPT
router.get('/movies/except', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT title FROM Movie
            EXCEPT
            SELECT title FROM Movie WHERE language = 'English'
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 20. Subquery
router.get('/movies/user/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', req.params.id)
            .query(`
                SELECT title FROM Movie
                WHERE movieId IN (
                    SELECT s.movieId
                    FROM ShowTable s
                    WHERE s.showId IN (
                        SELECT showId FROM Booking WHERE userId = @id
                    )
                )
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
