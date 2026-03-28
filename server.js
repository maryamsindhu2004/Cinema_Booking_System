const express = require('express');
const sql = require('mssql/msnodesqlv8');

const app = express();
app.use(express.json());

const config = {
    server: '(local)',      // or your machine name
    database: 'phase2',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true
    }
};


// connect once
sql.connect(config).then(() => {
    console.log("Connected to DB");
}).catch(err => console.log(err));

//1. ADD USER
app.post('/users', async (req, res) => {
    const { name, email, phoneNo } = req.body;

    try {
        await sql.query`
            INSERT INTO [User] (name, email, phoneNo)
            VALUES (${name}, ${email}, ${phoneNo})
        `;
        res.send("User added");
    } catch (err) {
        res.send(err);
    }
});

//2. Book Show
app.post('/booking', async (req, res) => {
    const { userId, showId } = req.body;

    try {
        await sql.query`
            INSERT INTO Booking (userId, showId)
            VALUES (${userId}, ${showId})
        `;
        res.send("Booking created");
    } catch (err) {
        res.send(err);
    }
});

//3. Cancel Booking (DELETE)
app.delete('/booking/:id', async (req, res) => {
    try {
        await sql.query`
            DELETE FROM Booking WHERE bookingId = ${req.params.id}
        `;
        res.send("Booking deleted");
    } catch (err) {
        res.send(err);
    }
});

//4. Update User
app.put('/users/:id', async (req, res) => {
    const { phoneNo } = req.body;

    try {
        await sql.query`
            UPDATE [User]
            SET phoneNo = ${phoneNo}
            WHERE userId = ${req.params.id}
        `;
        res.send("User updated");
    } catch (err) {
        res.send(err);
    }
});

// 5. View All Movies
app.get('/movies', async (req, res) => {
    const result = await sql.query`SELECT * FROM Movie`;
    res.json(result.recordset);
});

// 6. Search Movie (LIKE)
app.get('/movies/search/:name', async (req, res) => {
    const result = await sql.query`
        SELECT * FROM Movie
        WHERE title LIKE ${'%' + req.params.name + '%'}
    `;
    res.json(result.recordset);
});

//7. Movies by Genre
app.get('/movies/genre/:genre', async (req, res) => {
    const result = await sql.query`
        SELECT * FROM Movie WHERE genre = ${req.params.genre}
    `;
    res.json(result.recordset);
});

// 8. Show Schedule (JOIN)
app.get('/shows', async (req, res) => {
    const result = await sql.query`
        SELECT m.title, s.showDate, s.startTime
        FROM ShowTable s
        JOIN Movie m ON s.movieId = m.movieId
    `;
    res.json(result.recordset);
});

// 9. Booking Details
app.get('/bookings', async (req, res) => {
    const result = await sql.query`
        SELECT u.name, b.bookingId, s.showDate
        FROM Booking b
        JOIN [User] u ON b.userId = u.userId
        JOIN ShowTable s ON b.showId = s.showId
    `;
    res.json(result.recordset);
});

// 10. Users without Bookings (LEFT JOIN)
app.get('/users/no-bookings', async (req, res) => {
    const result = await sql.query`
        SELECT u.name
        FROM [User] u
        LEFT JOIN Booking b ON u.userId = b.userId
        WHERE b.bookingId IS NULL
    `;
    res.json(result.recordset);
});

// 11. Movies without Shows (RIGHT JOIN)
app.get('/movies/no-shows', async (req, res) => {
    const result = await sql.query`
        SELECT m.title
        FROM ShowTable s
        RIGHT JOIN Movie m ON s.movieId = m.movieId
        WHERE s.showId IS NULL
    `;
    res.json(result.recordset);
});

// 12. Full Outer Join
app.get('/users-bookings-all', async (req, res) => {
    const result = await sql.query`
        SELECT u.name, b.bookingId
        FROM [User] u
        FULL OUTER JOIN Booking b ON u.userId = b.userId
    `;
    res.json(result.recordset);
});

// 13. Total Bookings per Movie
app.get('/analytics/bookings-per-movie', async (req, res) => {
    const result = await sql.query`
        SELECT m.title, COUNT(b.bookingId) AS totalBookings
        FROM Booking b
        JOIN ShowTable s ON b.showId = s.showId
        JOIN Movie m ON s.movieId = m.movieId
        GROUP BY m.title
    `;
    res.json(result.recordset);
});

// 14. Movies with >1 Booking (HAVING)
app.get('/analytics/popular-movies', async (req, res) => {
    const result = await sql.query`
        SELECT m.title, COUNT(b.bookingId) AS totalBookings
        FROM Booking b
        JOIN ShowTable s ON b.showId = s.showId
        JOIN Movie m ON s.movieId = m.movieId
        GROUP BY m.title
        HAVING COUNT(b.bookingId) > 1
    `;
    res.json(result.recordset);
});

// 15. Average Seat Price
app.get('/analytics/avg-seat-price', async (req, res) => {
    const result = await sql.query`
        SELECT AVG(priceSeat) AS avgPrice FROM SeatType
    `;
    res.json(result.recordset);
});

// 16. Sort Movies
app.get('/movies/sorted', async (req, res) => {
    const result = await sql.query`
        SELECT * FROM Movie ORDER BY releaseDate DESC
    `;
    res.json(result.recordset);
});

// 17. UNION
app.get('/movies/union', async (req, res) => {
    const result = await sql.query`
        SELECT title FROM Movie WHERE language = 'English'
        UNION
        SELECT title FROM Movie WHERE language = 'Hindi'
    `;
    res.json(result.recordset);
});

// 18. INTERSECT
app.get('/movies/intersect', async (req, res) => {
    const result = await sql.query`
        SELECT title FROM Movie WHERE genre = 'Action'
        INTERSECT
        SELECT title FROM Movie WHERE language = 'Hindi'
    `;
    res.json(result.recordset);
});

// 19. EXCEPT
app.get('/movies/except', async (req, res) => {
    const result = await sql.query`
        SELECT title FROM Movie
        EXCEPT
        SELECT title FROM Movie WHERE language = 'English'
    `;
    res.json(result.recordset);
});

// 20. Subquery
app.get('/movies/user/:id', async (req, res) => {
    const result = await sql.query`
        SELECT title FROM Movie
        WHERE movieId IN (
            SELECT s.movieId
            FROM ShowTable s
            WHERE s.showId IN (
                SELECT showId FROM Booking WHERE userId = ${req.params.id}
            )
        )
    `;
    res.json(result.recordset);
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});
