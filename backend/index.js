const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConnection, sql } = require('./db');
const initDb = require('./initDb');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working!', 
        time: new Date() 
    });
});

// Database test endpoint

app.get('/api/db-test', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT GETDATE() as time');
        res.json({ 
            success: true, 
            message: 'Database connected!',
            time: result.recordset[0].time
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get all movies
app.get('/api/movies', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT m.*, 
                   STRING_AGG(g.genreName, ', ') AS genre
            FROM Movie m
            LEFT JOIN MovieGenre mg ON m.movieId = mg.movieId
            LEFT JOIN Genre g ON mg.genreId = g.genreId
            GROUP BY m.movieId, m.title, m.duration, m.releaseDate, m.rating, m.language, m.description
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get shows for a specific movie
app.get('/api/shows', async (req, res) => {
    try {
        const pool = await getConnection();
        const { movieId } = req.query;
        const result = await pool.request()
            .input('movieId', sql.Int, movieId)
            .query(`
                SELECT 
                    s.showId,
                    CONVERT(VARCHAR(10), s.showDate, 23) AS showDate,
                    CONVERT(VARCHAR(5), s.startTime, 108) AS startTime,
                    CONVERT(VARCHAR(5), s.endTime, 108) AS endTime,
                    c.name AS CinemaName, c.location AS CinemaLocation,
                    st.typeName AS ScreenType, st.priceScreen AS ScreenPrice,
                    (SELECT COUNT(*) FROM ShowSeatAvailability ssa WHERE ssa.showId = s.showId AND ssa.isBooked = 0) AS AvailableSeats
                FROM ShowTable s
                JOIN Screen sc ON s.screenId = sc.screenId
                JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
                JOIN Cinema c ON sc.cinemaId = c.cinemaId
                WHERE s.movieId = @movieId AND s.isCancelled = 0 AND s.showDate >= CAST(GETDATE() AS DATE)
                ORDER BY s.showDate, s.startTime
            `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get available screens for a movie
app.get('/api/screens', async (req, res) => {
    const { movieId } = req.query;
    console.log(`🔍 Fetching screens for Movie ID: ${movieId}`);
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('movieId', sql.Int, movieId)
            .query(`
                SELECT DISTINCT sc.screenId, c.name AS CinemaName, c.location AS CinemaLocation,
                    st.typeName AS ScreenType, st.priceScreen AS ScreenPrice, sc.totalSeats
                FROM ShowTable s
                JOIN Screen sc ON s.screenId = sc.screenId
                JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
                JOIN Cinema c ON sc.cinemaId = c.cinemaId
                WHERE s.movieId = @movieId AND s.isCancelled = 0 
                  AND s.showDate >= CAST(GETDATE() AS DATE)
                ORDER BY c.name, st.typeName
            `);
        console.log(`✅ Found ${result.recordset.length} screens`);
        res.json({ success: true, data: result.recordset });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

// Get available dates for a movie + screen
app.get('/api/show-dates', async (req, res) => {
    const { movieId, screenId } = req.query;
    console.log(`📅 Fetching dates for Movie ID: ${movieId}, Screen ID: ${screenId}`);
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('movieId', sql.Int, movieId)
            .input('screenId', sql.Int, screenId)
            .query(`
                SELECT DISTINCT
                    CONVERT(VARCHAR(10), s.showDate, 23) AS showDate,
                    DATENAME(WEEKDAY, s.showDate) AS dayName
                FROM ShowTable s
                WHERE s.movieId = @movieId AND s.screenId = @screenId
                  AND s.isCancelled = 0 
                  AND s.showDate >= CAST(GETDATE() AS DATE)
            `);
        console.log(`✅ Found ${result.recordset.length} dates`);
        res.json({ success: true, data: result.recordset });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

// Get timings for a movie + screen + date
app.get('/api/show-timings', async (req, res) => {
    const { movieId, screenId, date } = req.query;
    console.log(`⏰ Fetching timings for Movie ID: ${movieId}, Screen ID: ${screenId}, Date: ${date}`);
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('movieId', sql.Int, movieId)
            .input('screenId', sql.Int, screenId)
            .input('date', sql.Date, date)
            .query(`
                SELECT s.showId,
                    CONVERT(VARCHAR(5), s.startTime, 108) AS startTime,
                    CONVERT(VARCHAR(5), s.endTime, 108) AS endTime,
                    (SELECT COUNT(*) FROM ShowSeatAvailability ssa WHERE ssa.showId = s.showId AND ssa.isBooked = 0) AS AvailableSeats
                FROM ShowTable s
                WHERE s.movieId = @movieId AND s.screenId = @screenId
                  AND s.showDate = @date AND s.isCancelled = 0
                ORDER BY s.startTime
            `);
        res.json({ success: true, data: result.recordset });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

// Get seats using SQL CTE for ordered seat layout
app.get('/api/seats/:showId', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('showId', sql.Int, req.params.showId)
            .query(`
                WITH SeatCTE AS (
                    SELECT se.seatId, se.seatNo, se.rowNo, se.seatTypeId,
                        ROW_NUMBER() OVER (ORDER BY se.rowNo, TRY_CAST(se.seatNo AS INT)) AS SeatOrder,
                        se.isWheelchairAllow
                    FROM ShowTable s
                    JOIN Screen sc ON s.screenId = sc.screenId
                    JOIN Seat se ON sc.screenId = se.screenId
                    WHERE s.showId = @showId AND se.isActive = 1
                )
                SELECT sc.seatId, sc.seatNo, sc.rowNo, sc.SeatOrder, sc.isWheelchairAllow,
                    st.category AS SeatCategory, st.priceSeat AS BaseSeatPrice,
                    CASE WHEN ssa.isBooked = 1 THEN 'Booked' ELSE 'Available' END AS Status
                FROM SeatCTE sc
                JOIN SeatType st ON sc.seatTypeId = st.seatTypeId
                LEFT JOIN ShowSeatAvailability ssa ON ssa.showId = @showId AND sc.seatId = ssa.seatId
                ORDER BY sc.SeatOrder
            `);
        res.json({ success: true, data: result.recordset });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

// Get Feedback for a Movie
app.get('/api/movie-feedback/:movieId', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('movieId', sql.Int, req.params.movieId)
            .query(`
                SELECT f.rating, f.comments, f.feedbackDate, u.name as UserName
                FROM Feedback f
                JOIN Booking b ON f.bookingId = b.bookingId
                JOIN Users u ON f.userId = u.id
                WHERE b.showId IN (SELECT showId FROM ShowTable WHERE movieId = @movieId)
                ORDER BY f.feedbackDate DESC
            `);
        res.json({ success: true, data: result.recordset });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

// Submit Feedback
app.post('/api/add-feedback', async (req, res) => {
    const { userId, bookingId, rating, comments } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('bookingId', sql.Int, bookingId)
            .input('rating', sql.Int, rating)
            .input('comments', sql.VarChar, comments)
            .execute('sp_AddFeedback');
        res.json({ success: true, message: 'Feedback submitted!' });
    } catch (e) { res.json({ success: false, error: e.message }); }
});


// Book a ticket
app.post('/api/book-ticket', async (req, res) => {
    const { userId, showId, seatIds, discountCode } = req.body;
    if (!userId || !showId || !seatIds || seatIds.length === 0) {
        return res.json({ success: false, error: 'Missing required fields.' });
    }
    try {
        const pool = await getConnection();
        // Convert array [1,2,3] to string "1,2,3"
        const seatIdsString = seatIds.join(',');
        
        const bookingReq = pool.request();
        bookingReq.input('userId', sql.Int, userId);
        bookingReq.input('showId', sql.Int, showId);
        bookingReq.input('seatIds', sql.VarChar, seatIdsString);
        bookingReq.input('discountCode', sql.VarChar, discountCode || null);
        
        const result = await bookingReq.execute('sp_BookTicket');
        const row = result.recordset[0];
        
        if (row?.BookingID) {
            res.json({ 
                success: true, 
                bookingId: row.BookingID, 
                totalAmount: row.TotalAmount,
                message: row.Status
            });
        } else {
            res.json({ success: false, error: row?.ErrorMessage || 'Booking failed.' });
        }
    } catch (error) {
        console.error('Booking Error:', error);
        res.json({ success: false, error: error.message });
    }
});

// Process Payment
app.post('/api/payment', async (req, res) => {
    const { bookingId, paymentMethod, transactionId } = req.body;
    try {
        const pool = await getConnection();
        const req2 = pool.request();
        req2.input('bookingId', sql.Int, bookingId);
        req2.input('paymentMethod', sql.VarChar, paymentMethod);
        req2.input('transactionId', sql.VarChar, transactionId || `TXN-${Date.now()}`);
        req2.output('result', sql.VarChar);
        const result = await req2.execute('sp_ProcessPayment');
        const row = result.recordset[0];
        if (row && row.Status === 'Payment Successful') {
            res.json({ success: true, message: row.Status, amountPaid: row.AmountPaid });
        } else {
            res.json({ success: false, error: row?.ErrorMessage || 'Payment failed' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Submit Feedback
app.post('/api/feedback', async (req, res) => {
    const sql = require('mssql');
    const { userId, bookingId, rating, comments } = req.body;
    try {
        const pool = await getConnection();
        const req2 = pool.request();
        req2.input('userId', sql.Int, userId);
        req2.input('bookingId', sql.Int, bookingId);
        req2.input('rating', sql.Int, rating);
        req2.input('comments', sql.VarChar, comments);
        const result = await req2.execute('sp_AddFeedback');
        const row = result.recordset[0];
        res.json({ success: row?.FeedbackID != null, feedbackId: row?.FeedbackID, message: row?.Status || row?.ErrorMessage });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get Booking History for a user
app.get('/api/bookings/:userId', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('userId', sql.Int, req.params.userId)
            .query(`
                SELECT 
                    b.bookingId, b.bookingDate, b.totalAmount, b.paymentStatus,
                    m.title AS MovieTitle, m.language, m.rating,
                    c.name AS CinemaName,
                    s.showDate, s.startTime, s.endTime,
                    st.typeName AS ScreenType,
                    COUNT(bs.seatId) AS SeatCount,
                    CASE WHEN f.feedbackId IS NOT NULL THEN 1 ELSE 0 END AS HasFeedback
                FROM Booking b
                JOIN ShowTable s ON b.showId = s.showId
                JOIN Movie m ON s.movieId = m.movieId
                JOIN Screen sc ON s.screenId = sc.screenId
                JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
                JOIN Cinema c ON sc.cinemaId = c.cinemaId
                LEFT JOIN BookingSeat bs ON b.bookingId = bs.bookingId
                LEFT JOIN Feedback f ON b.bookingId = f.bookingId
                WHERE b.userId = @userId
                GROUP BY b.bookingId, b.bookingDate, b.totalAmount, b.paymentStatus,
                         m.title, m.language, m.rating, c.name,
                         s.showDate, s.startTime, s.endTime, st.typeName, f.feedbackId
                ORDER BY b.bookingDate DESC
            `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Search Movies
app.get('/api/movies/search', async (req, res) => {
    const { name, genre, language } = req.query;
    try {
        const pool = await getConnection();
        const req2 = pool.request();
        req2.input('movieName', sql.VarChar, name || null);
        req2.input('genre', sql.VarChar, genre || null);
        req2.input('language', sql.VarChar, language || null);
        req2.input('startDate', sql.Date, null);
        req2.input('endDate', sql.Date, null);
        const result = await req2.execute('sp_SearchMovies');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Cancel Booking
app.post('/api/cancel-booking', async (req, res) => {
    const { bookingId, userId } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('bookingId', sql.Int, bookingId)
            .input('userId', sql.Int, userId)
            .execute('sp_CancelBooking');

        const status = result.recordset[0].Status;
        if (status === 'Success') {
            res.json({ success: true, message: result.recordset[0].Message });
        } else {
            console.error("❌ SQL Error during cancellation:", result.recordset[0].ErrorMessage);
            res.json({ success: false, error: result.recordset[0].ErrorMessage });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get Food Menu Items
app.get('/api/menu', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`SELECT * FROM Item WHERE isAvailable = 1 ORDER BY category, itemName`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Place Food Order
app.post('/api/food-order', async (req, res) => {
    const { bookingId, items } = req.body; // items format: "itemId:qty,itemId:qty"
    try {
        const pool = await getConnection();
        const req2 = pool.request();
        req2.input('bookingId', sql.Int, bookingId);
        req2.input('items', sql.VarChar, items);
        const result = await req2.execute('sp_OrderFood');
        const row = result.recordset[0];
        res.json({ success: !!row?.FoodOrderID, data: row });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});


// Serve React frontend (when built into /public)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// React Router catch-all — must be AFTER all API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server and initialize DB
app.listen(PORT, async () => {
    console.log(`🎭 THEATRO App running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    // Initialize required tables
    await initDb();
});