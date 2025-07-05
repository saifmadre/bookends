// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('config'); // Import the config package here
// const User = require('../models/User'); // Removed User model import as it's not used in this version

// Define the authenticateToken middleware function
const authenticateToken = (req, res, next) => { // Changed to synchronous as no await/async operations
    // Get token from header. Common practice is to send it in the 'x-auth-token' header
    const token = req.header('x-auth-token');

    // For debugging: Log the received token
    console.log('Received Token:', token ? token.substring(0, 30) + '...' : 'No Token'); // Log first 30 chars

    // Check if no token is provided
    if (!token) {
        // If no token, return 401 Unauthorized status with a message
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify the token using your JWT_SECRET from environment variables
        // CORRECTED: Use config.get('jwtSecret') instead of process.env.JWT_SECRET
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        // Attach the decoded user information to the request object.
        // This makes user data available to subsequent route handlers.
        req.user = decoded.user;
        console.log('Token decoded successfully. User ID:', req.user.id);

        // Call next() to pass control to the next middleware function
        // in the request-response cycle, or to the route handler itself.
        next();
    } catch (err) {
        // If the token verification fails (e.g., token is expired or invalid)
        // return 401 Unauthorized status with an appropriate message
        console.error('Token verification failed:', err.message); // Log the specific error
        // CRITICAL FIX: Ensure JSON response for invalid/expired token
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired, please log in again' });
        }
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Export the authenticateToken function as a named property of an object.
// This allows other files to import it using destructuring, like:
// const { authenticateToken } = require('../middleware/authMiddleware');
module.exports = { authenticateToken };
