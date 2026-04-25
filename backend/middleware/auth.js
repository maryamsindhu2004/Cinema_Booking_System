const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');

    // Check if no token is provided
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const jwtSecret = process.env.JWT_SECRET || 'theatro_super_secret_key_2026';
        const decoded = jwt.verify(token, jwtSecret);

        // Add user info from payload to request
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
