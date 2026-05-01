const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConnection } = require('./db');
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

// Get all movies with their genres (BCNF Join)
app.get('/api/movies', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                m.*,
                STRING_AGG(g.genreName, ', ') AS genre
            FROM Movie m
            LEFT JOIN MovieGenre mg ON m.movieId = mg.movieId
            LEFT JOIN Genre g ON mg.genreId = g.genreId
            GROUP BY m.movieId, m.title, m.duration, m.releaseDate, m.rating, m.language
        `);
        res.json({ success: true, data: result.recordset });
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