const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConnection } = require('./db');
const initDb = require('./initDb');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/db-test', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT GETDATE() as time');
        res.json({ success: true, message: 'Database connected!', time: result.recordset[0].time });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/movies', async (req, res) => {
    try {
        const { genre, language } = req.query;
        console.log(`🔍 [API] Filter: Genre=${genre || 'All'}, Lang=${language || 'All'}`);
        const pool = await getConnection();
        const request = pool.request();
        let query = `
            SELECT m.*, (SELECT STRING_AGG(g2.genreName, ', ') FROM MovieGenre mg2 JOIN Genre g2 ON mg2.genreId = g2.genreId WHERE mg2.movieId = m.movieId) AS genre
            FROM Movie m WHERE 1=1
        `;
        if (genre) {
            request.input('g', genre);
            query += ` AND EXISTS (SELECT 1 FROM MovieGenre mg3 JOIN Genre g3 ON mg3.genreId = g3.genreId WHERE mg3.movieId = m.movieId AND LOWER(g3.genreName) = LOWER(@g))`;
        }
        if (language) {
            request.input('l', language);
            query += ` AND LOWER(m.language) = LOWER(@l)`;
        }
        const result = await request.query(query);
        console.log(`✅ [API] Found ${result.recordset.length} movies`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/movies/:id/shows', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().input('id', req.params.id).query(`
            SELECT 
                s.showId, s.movieId, s.screenId, s.showDate, s.isCancelled,
                CONVERT(VARCHAR(5), s.startTime, 108) as startTime,
                CONVERT(VARCHAR(5), s.endTime, 108) as endTime,
                c.name as cinemaName, c.location, st.typeName as screenType
            FROM ShowTable s 
            JOIN Screen sc ON s.screenId = sc.screenId 
            JOIN Cinema c ON sc.cinemaId = c.cinemaId 
            JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
            WHERE s.movieId = @id AND s.isCancelled = 0 
            ORDER BY s.showDate, s.startTime
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/shows/:id/seats', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().input('sid', req.params.id).query(`
            SELECT s.*, st.category, st.priceSeat, CASE WHEN bs.seatId IS NOT NULL THEN 1 ELSE 0 END as isBooked
            FROM Seat s JOIN ShowTable sh ON s.screenId = sh.screenId JOIN SeatType st ON s.seatTypeId = st.seatTypeId
            LEFT JOIN BookingSeat bs ON s.seatId = bs.seatId AND bs.bookingId IN (SELECT bookingId FROM Booking WHERE showId = @sid)
            WHERE sh.showId = @sid ORDER BY s.rowNo, s.seatNo
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

const pub = path.join(__dirname, 'public');
app.use(express.static(pub));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({error: 'No API'});
    res.sendFile(path.join(pub, 'index.html'));
});

app.listen(PORT, async () => {
    console.log(`🎭 Backend on ${PORT}`);
    await initDb();
});