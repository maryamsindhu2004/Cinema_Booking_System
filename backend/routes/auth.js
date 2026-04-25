const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getConnection } = require('../db');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    try {
        const pool = await getConnection();

        // Check if user already exists
        const userCheck = await pool.request()
            .input('email', email)
            .query('SELECT id FROM Users WHERE email = @email');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const result = await pool.request()
            .input('name', name)
            .input('email', email)
            .input('password_hash', hashedPassword)
            .query(`
                INSERT INTO Users (name, email, password_hash) 
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.email
                VALUES (@name, @email, @password_hash)
            `);

        const user = result.recordset[0];

        res.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    try {
        const pool = await getConnection();

        // Find user
        const result = await pool.request()
            .input('email', email)
            .query('SELECT * FROM Users WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        res.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
