const express = require('express');
const cors = require('cors');
const { getConnection } = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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
        const result = await pool.request().query('SELECT * FROM Movie');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🎭 THEATRO Backend running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}/api/test`);
});