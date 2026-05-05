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

// GET /api/movies - Fetch movies with Genres, Search, and "Showing Now" filter
app.get('/api/movies', async (req, res) => {
    try {
        const { genre, language, search, showingOnly } = req.query;
        const pool = await getConnection();

        let query = `
            SELECT m.*, 
            (SELECT STRING_AGG(g2.genreName, ', ') 
             FROM MovieGenre mg2 
             JOIN Genre g2 ON mg2.genreId = g2.genreId 
             WHERE mg2.movieId = m.movieId) AS genre
            FROM Movie m
        `;

        // If showingOnly, ensure movie has active future shows
        if (showingOnly === 'true') {
            query += ` JOIN ShowTable s ON m.movieId = s.movieId AND s.showDate >= CAST(GETDATE() AS DATE) AND s.isCancelled = 0`;
        }

        let conditions = [];
        if (genre && genre !== 'All') {
            conditions.push(`EXISTS (SELECT 1 FROM MovieGenre mg3 JOIN Genre g3 ON mg3.genreId = g3.genreId WHERE mg3.movieId = m.movieId AND g3.genreName = @genre)`);
        }
        if (language && language !== 'All') conditions.push(`m.language = @lang`);
        if (search) conditions.push(`m.title LIKE @search`);

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        const request = pool.request();
        if (genre) request.input('genre', genre);
        if (language) request.input('lang', language);
        if (search) request.input('search', `%${search}%`);

        const result = await request.query(query);
        console.log(`🔍 [API] Movies Loaded: ${result.recordset.length} (Search: "${search || ''}")`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error(`❌ Movie Load Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/movies/:id/shows', async (req, res) => {
    try {
        const { weekendOnly } = req.query;
        const pool = await getConnection();

        let query = `
            SELECT 
                s.showId, s.movieId, s.screenId, s.showDate, s.isCancelled,
                CONVERT(VARCHAR(5), s.startTime, 108) as startTime,
                CONVERT(VARCHAR(5), s.endTime, 108) as endTime,
                c.name as cinemaName, c.location, 
                st.typeName as screenType, st.priceScreen, st.description as screenDesc,
                (SELECT COUNT(*) FROM Seat WHERE screenId = sc.screenId AND isWheelchairAllow = 1) as wheelchairCount
            FROM ShowTable s 
            JOIN Screen sc ON s.screenId = sc.screenId 
            JOIN Cinema c ON sc.cinemaId = c.cinemaId 
            JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
            WHERE s.movieId = @id AND s.isCancelled = 0
        `;

        if (weekendOnly === 'true') {
            query += " AND DATEPART(weekday, s.showDate) IN (1, 6, 7)";
        }

        query += " ORDER BY s.showDate, s.startTime";

        const result = await pool.request()
            .input('id', req.params.id)
            .query(query);

        console.log(`📡 [API] Found ${result.recordset.length} shows for Movie ${req.params.id} (WeekendOnly: ${weekendOnly})`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error(`❌ Shows Load Error: ${error.message}`);
        res.json({ success: false, error: error.message });
    }
});

// GET /api/shows/:id - Fetch show info + screen price
app.get('/api/shows/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().input('sid', req.params.id).query(`
            SELECT s.*, st.priceScreen, st.typeName, c.name as cinemaName
            FROM ShowTable s 
            JOIN Screen sc ON s.screenId = sc.screenId 
            JOIN ScreenType st ON sc.screenTypeId = st.screenTypeId
            JOIN Cinema c ON sc.cinemaId = c.cinemaId
            WHERE s.showId = @sid
        `);
        if (result.recordset.length > 0) {
            res.json({ success: true, data: result.recordset[0] });
        } else {
            res.status(404).json({ success: false, error: 'Show not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/shows/:id/seats - Fetch seats with Weekend Surcharge (+100)
app.get('/api/shows/:id/seats', async (req, res) => {
    try {
        const showId = parseInt(req.params.id);
        if (isNaN(showId)) {
            console.error(`❌ Invalid Show ID: ${req.params.id}`);
            return res.status(400).json({ success: false, error: 'Invalid Show ID' });
        }

        const pool = await getConnection();

        // Debug: Check if show exists first
        const showCheck = await pool.request().input('sid', showId).query('SELECT screenId, showDate FROM ShowTable WHERE showId = @sid');
        if (showCheck.recordset.length === 0) {
            console.error(`❌ Show ${showId} not found in database`);
            return res.status(404).json({ success: false, error: 'Show not found' });
        }
        const { screenId, showDate } = showCheck.recordset[0];

        // Fetch all seats for this screen
        const result = await pool.request()
            .input('sid', showId)
            .input('scid', screenId)
            .input('sd', showDate)
            .query(`
                SELECT 
                    s.seatId, s.seatNo, s.rowNo, s.isWheelchairAllow,
                    st.category,
                    st.priceSeat as basePrice,
                    CASE WHEN DATENAME(weekday, CAST(@sd AS DATE)) IN ('Friday', 'Saturday', 'Sunday') THEN 100 ELSE 0 END as weekendFee,
                    (st.priceSeat + CASE WHEN DATENAME(weekday, CAST(@sd AS DATE)) IN ('Friday', 'Saturday', 'Sunday') THEN 100 ELSE 0 END) as priceSeat,
                    CASE WHEN bs.seatId IS NOT NULL THEN 1 ELSE 0 END as isBooked
                FROM Seat s 
                JOIN SeatType st ON s.seatTypeId = st.seatTypeId 
                LEFT JOIN BookingSeat bs ON s.seatId = bs.seatId AND bs.bookingId IN (SELECT bookingId FROM Booking WHERE showId = @sid AND bookingStatus = 1)
                WHERE s.screenId = @scid
            `);

        if (result.recordset.length > 0) {
            const first = result.recordset[0];
            console.log(`💰 [PRICING] Day: ${showDate.toDateString()}, Base: ${first.basePrice}, Fee: ${first.weekendFee}, Total: ${first.priceSeat}`);
        }

        console.log(`🔍 [DEBUG] Show: ${showId}, Screen: ${screenId}, Seats: ${result.recordset.length}`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error(`❌ Seat Load Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/items - Fetch food and snacks
app.get('/api/items', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Item');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// POST /api/bookings - The core booking logic + Loyalty Rewards
app.post('/api/bookings', async (req, res) => {
    const { userId, showId, seats, items, totalAmount, redeemNachos, paymentMethod, needsWheelchair } = req.body;

    if (!userId || !showId || !seats || seats.length === 0) {
        return res.status(400).json({ success: false, error: 'Missing booking info' });
    }

    let transaction;
    try {
        const pool = await getConnection();
        transaction = pool.transaction();
        await transaction.begin();

        // 1. Loyalty Checks
        const userRes = await transaction.request().input('uid', userId).query('SELECT loyaltyPoints FROM Users WHERE id = @uid');
        let points = userRes.recordset[0].loyaltyPoints || 0;
        let appliedDiscount = 0;
        let freeNachosReward = false;

        if (redeemNachos && points >= 20) {
            freeNachosReward = true;
            await transaction.request().input('uid', userId).query('UPDATE Users SET loyaltyPoints = loyaltyPoints - 20 WHERE id = @uid');
            console.log(`🎁 [LOYALTY] Redeemed nachos: -20 pts from User ${userId} (had ${points} pts)`);
        }

        // 2. Create the Main Booking
        const bookingResult = await transaction.request()
            .input('userId', userId)
            .input('showId', showId)
            .input('pm', paymentMethod || 'Cash')
            .input('wheel', needsWheelchair ? 1 : 0)
            .query('INSERT INTO Booking (userId, showId, bookingDate, bookingStatus, paymentMethod, needsWheelchair) VALUES (@userId, @showId, GETDATE(), 1, @pm, @wheel); SELECT SCOPE_IDENTITY() AS bookingId;');

        const bookingId = bookingResult.recordset[0].bookingId;

        // 3. Link Seats
        for (const seatId of seats) {
            await transaction.request()
                .input('bid', bookingId)
                .input('sid', seatId)
                .query('INSERT INTO BookingSeat (bookingId, seatId) VALUES (@bid, @sid)');
        }

        // 4. Handle Food & Rewards
        let foodItems = items ? [...items] : [];

        // Reward 1: Free Popcorn (4+ tickets)
        if (seats.length >= 4) {
            const popcornRes = await transaction.request().query("SELECT itemId FROM Item WHERE itemName = 'Small Popcorn'");
            if (popcornRes.recordset.length > 0) {
                foodItems.push({ itemId: popcornRes.recordset[0].itemId, quantity: 1, isFree: true });
            }
        }

        // Reward 2: Redeemed Nachos (20 pts)
        if (freeNachosReward) {
            const nachosRes = await transaction.request().query("SELECT itemId FROM Item WHERE itemName = 'Nachos'");
            if (nachosRes.recordset.length > 0) {
                foodItems.push({ itemId: nachosRes.recordset[0].itemId, quantity: 1, isFree: true });
            }
        }

        if (foodItems.length > 0) {
            const foodOrderResult = await transaction.request()
                .input('bid', bookingId)
                .query('INSERT INTO FoodOrder (bookingId, orderDate) OUTPUT INSERTED.foodOrderId VALUES (@bid, GETDATE())');

            const foodOrderId = foodOrderResult.recordset[0].foodOrderId;
            let foodTotal = 0;

            for (const item of foodItems) {
                await transaction.request()
                    .input('foid', foodOrderId)
                    .input('itemId', item.itemId)
                    .input('qty', item.quantity)
                    .input('isFree', item.isFree ? 1 : 0)
                    .query('INSERT INTO FoodOrderDetail (foodOrderId, itemId, quantity, isFree) VALUES (@foid, @itemId, @qty, @isFree)');

                const itemRes = await transaction.request().input('iid', item.itemId).query('SELECT basePrice FROM Item WHERE itemId = @iid');

                if (itemRes.recordset.length > 0 && !item.isFree) {
                    // parseFloat ensures DECIMAL from SQL doesn't behave as string
                    const price = parseFloat(itemRes.recordset[0].basePrice);
                    const qty   = parseInt(item.quantity, 10);
                    foodTotal += (price * qty);
                }
            }

            // 1 point earned per Rs 100 of PAID food
            const earnedPoints = Math.floor(foodTotal / 100);
            console.log(`💰 [LOYALTY] Paid food total: Rs. ${foodTotal} → +${earnedPoints} pts for User ${userId}`);

            if (earnedPoints > 0) {
                await transaction.request().input('uid', userId).input('pts', earnedPoints).query('UPDATE Users SET loyaltyPoints = ISNULL(loyaltyPoints, 0) + @pts WHERE id = @uid');
            }
        }

        await transaction.commit();
        res.json({ success: true, bookingId, discountApplied: appliedDiscount > 0 });

    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/user/:userId - Fetch latest user info (for points)
app.get('/api/user/:userId', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('uid', req.params.userId)
            .query('SELECT id, name, email, phoneNo, loyaltyPoints, isAdmin FROM Users WHERE id = @uid');

        if (result.recordset.length > 0) {
            console.log(`👤 [USER] Syncing data for ${result.recordset[0].name}: ${result.recordset[0].loyaltyPoints} pts (Admin: ${result.recordset[0].isAdmin})`);
            res.json({ success: true, data: result.recordset[0] });
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const pub = path.join(__dirname, 'public');
app.use(express.static(pub));

// GET /api/bookings/user/:userId - Fetch booking history
app.get('/api/bookings/user/:userId', async (req, res) => {
    console.log(`📡 [API] Fetching history for User ID: ${req.params.userId}`);
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('uid', req.params.userId)
            .query(`
                SELECT 
                    b.bookingId, b.bookingDate, b.paymentMethod,
                    m.title as movieTitle, s.showDate, 
                    CONVERT(VARCHAR(5), s.startTime, 108) as startTime,
                    STUFF((
                        SELECT ', ' + se.seatNo 
                        FROM BookingSeat bs 
                        JOIN Seat se ON bs.seatId = se.seatId 
                        WHERE bs.bookingId = b.bookingId 
                        FOR XML PATH('')), 1, 2, '') as seats,
                    STUFF((
                        SELECT ', ' + i.itemName + ' (x' + CAST(fod.quantity AS VARCHAR(10)) + ')'
                        FROM FoodOrder fo 
                        JOIN FoodOrderDetail fod ON fo.foodOrderId = fod.foodOrderId 
                        JOIN Item i ON fod.itemId = i.itemId 
                        WHERE fo.bookingId = b.bookingId 
                        FOR XML PATH('')), 1, 2, '') as snacks,
                    -- Calculate total: (Base Seat Prices) + (Weekend Fees) + (Food Total)
                    ISNULL((
                        SELECT SUM(st.priceSeat) 
                        FROM BookingSeat bs 
                        JOIN Seat se ON bs.seatId = se.seatId 
                        JOIN SeatType st ON se.seatTypeId = st.seatTypeId 
                        WHERE bs.bookingId = b.bookingId
                    ), 0) + 
                    ISNULL((
                        SELECT COUNT(*) * (CASE WHEN DATENAME(weekday, s.showDate) IN ('Friday', 'Saturday', 'Sunday') THEN 100 ELSE 0 END)
                        FROM BookingSeat bs 
                        WHERE bs.bookingId = b.bookingId
                    ), 0) + 
                    ISNULL(st2.priceScreen, 0) + 
                    ISNULL((
                        SELECT SUM(i.basePrice * fod.quantity) 
                        FROM FoodOrder fo 
                        JOIN FoodOrderDetail fod ON fo.foodOrderId = fod.foodOrderId 
                        JOIN Item i ON fod.itemId = i.itemId 
                        WHERE fo.bookingId = b.bookingId AND ISNULL(fod.isFree, 0) = 0
                    ), 0) as totalAmount
                FROM Booking b
                JOIN ShowTable s ON b.showId = s.showId
                JOIN Movie m ON s.movieId = m.movieId
                JOIN Screen sc2 ON s.screenId = sc2.screenId
                JOIN ScreenType st2 ON sc2.screenTypeId = st2.screenTypeId
                WHERE b.userId = @uid
                ORDER BY b.bookingDate DESC
            `);
        console.log(`✅ [API] Found ${result.recordset.length} records`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ [API] History Error:', error.message);
        res.json({ success: false, error: error.message });
    }
});

// POST /api/bookings/:id/cancel - Cancel booking and refund
app.post('/api/bookings/:id/cancel', async (req, res) => {
    let transaction;
    try {
        const pool = await getConnection();
        transaction = pool.transaction();
        await transaction.begin();

        const bookingId = req.params.id;

        // 1. Get UserID and Calculate Refund Amount
        const infoResult = await transaction.request()
            .input('bid', bookingId)
            .query(`
                SELECT 
                    b.userId,
                    ISNULL((SELECT SUM(st.priceSeat) FROM BookingSeat bs JOIN Seat se ON bs.seatId = se.seatId JOIN SeatType st ON se.seatTypeId = st.seatTypeId WHERE bs.bookingId = @bid), 0) as seatTotal,
                    -- Only count PAID food items for points deduction (exclude free rewards)
                    ISNULL((SELECT SUM(i.basePrice * fod.quantity) FROM FoodOrder fo JOIN FoodOrderDetail fod ON fo.foodOrderId = fod.foodOrderId JOIN Item i ON fod.itemId = i.itemId WHERE fo.bookingId = @bid AND ISNULL(fod.isFree, 0) = 0), 0) as foodTotal
                FROM Booking b WHERE b.bookingId = @bid
            `);

        if (infoResult.recordset.length === 0) throw new Error("Booking not found");

        const { userId, seatTotal, foodTotal } = infoResult.recordset[0];
        const refundAmount = seatTotal + foodTotal;

        // 2. Point Deduction: Deduct 1 pt per 100 Rs of food being refunded
        const pointsToDeduct = Math.floor(foodTotal / 100);
        if (pointsToDeduct > 0) {
            await transaction.request()
                .input('uid', userId)
                .input('pts', pointsToDeduct)
                .query('UPDATE Users SET loyaltyPoints = CASE WHEN loyaltyPoints >= @pts THEN loyaltyPoints - @pts ELSE 0 END WHERE id = @uid');
            console.log(`📉 [LOYALTY] Deducted ${pointsToDeduct} points from User ${userId} due to refund.`);
        }

        // 3. Update Booking Status to 0 (Cancelled)
        await transaction.request()
            .input('bid', bookingId)
            .query('UPDATE Booking SET bookingStatus = 0 WHERE bookingId = @bid');

        // 4. Release Seats
        await transaction.request()
            .input('bid', bookingId)
            .query('DELETE FROM BookingSeat WHERE bookingId = @bid');

        // 5. Record Refund
        try {
            await transaction.request()
                .input('bid', bookingId)
                .input('amt', refundAmount)
                .query('INSERT INTO Refund (bookingId, refundAmount, refundDate, refundStatus) VALUES (@bid, @amt, GETDATE(), \'Processed\')');
        } catch (e) {
            console.warn("⚠️ Refund record skipped (Refund table might not exist)");
        }

        await transaction.commit();
        res.json({ success: true, message: 'Booking cancelled. Points adjusted and refund processed!' });
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/feedback - Save user experience feedback
app.post('/api/feedback', async (req, res) => {
    const { userId, rating, comments } = req.body;
    if (!userId || !rating) {
        return res.status(400).json({ success: false, error: 'Missing userId or rating' });
    }
    try {
        const pool = await getConnection();
        await pool.request()
            .input('uid', userId)
            .input('rate', rating)
            .input('msg', comments || '')
            .query('INSERT INTO Feedback (userId, rating, comments) VALUES (@uid, @rate, @msg)');

        console.log(`💬 [FEEDBACK] New feedback from User ${userId}: ${rating} stars`);
        res.json({ success: true, message: 'Feedback submitted! Thank you.' });
    } catch (error) {
        console.error('❌ Feedback Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- ADMIN ROUTES ---

// GET /api/admin/feedback - Fetch all feedback with user names
app.get('/api/admin/feedback', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT f.*, u.name as userName, u.email as userEmail 
            FROM Feedback f 
            JOIN Users u ON f.userId = u.id 
            ORDER BY f.submitted_at DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Admin Feedback Load Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/feedback/:id/respond - Respond to feedback
app.post('/api/admin/feedback/:id/respond', async (req, res) => {
    const { response } = req.body;
    const feedbackId = req.params.id;

    if (!response) {
        return res.status(400).json({ success: false, error: 'Response content is required' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input('fid', feedbackId)
            .input('res', response)
            .query('UPDATE Feedback SET adminResponse = @res, respondedAt = GETDATE() WHERE feedbackId = @fid');

        console.log(`💬 [ADMIN] Responded to Feedback ID: ${feedbackId}`);
        res.json({ success: true, message: 'Response submitted successfully!' });
    } catch (error) {
        console.error('❌ Admin Respond Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/revenue - Fetch monthly revenue breakdown
app.get('/api/admin/revenue', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            WITH BookingTotals AS (
                SELECT 
                    b.bookingId,
                    b.bookingDate,
                    ISNULL((SELECT SUM(st.priceSeat) FROM BookingSeat bs JOIN Seat se ON bs.seatId = se.seatId JOIN SeatType st ON se.seatTypeId = st.seatTypeId WHERE bs.bookingId = b.bookingId), 0) as ticketRev,
                    ISNULL((SELECT SUM(i.basePrice * fod.quantity) FROM FoodOrder fo JOIN FoodOrderDetail fod ON fo.foodOrderId = fod.foodOrderId JOIN Item i ON fod.itemId = i.itemId WHERE fo.bookingId = b.bookingId), 0) as foodRev
                FROM Booking b
                WHERE b.bookingStatus = 1
            )
            SELECT 
                CAST(YEAR(bookingDate) AS VARCHAR) + '-' + RIGHT('0' + CAST(MONTH(bookingDate) AS VARCHAR), 2) as month,
                COUNT(bookingId) as totalBookings,
                SUM(ticketRev + foodRev) as totalRevenue,
                SUM(foodRev) as foodRevenue,
                SUM(ticketRev) as ticketRevenue
            FROM BookingTotals
            GROUP BY YEAR(bookingDate), MONTH(bookingDate)
            ORDER BY month DESC
        `);

        console.log(`💰 [ADMIN] Revenue data loaded: ${result.recordset.length} months`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Admin Revenue Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});






app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'No API' });
    res.sendFile(path.join(pub, 'index.html'));
});

app.listen(PORT, '127.0.0.1', async () => {
    console.log(`🎭 THEATRO Backend on http://127.0.0.1:${PORT}`);
    await initDb();
    setInterval(() => console.log(` [${new Date().toLocaleTimeString()}] Heartbeat: Backend is Alive`), 10000);
});