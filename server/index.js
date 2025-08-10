const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file
const path = require('path'); // NEW: Import path module for serving static files

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes

// IMPORTANT FIX: Increase body parser limits to allow larger payloads (e.g., for image uploads)
app.use(express.json({ limit: '50mb' })); // Enable parsing of JSON request bodies with increased limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Enable parsing of URL-encoded data with increased limit

// NEW: Serve static files from the 'uploads' directory
// This allows your frontend to access uploaded images via URLs like http://localhost:5000/uploads/profile_images/your-image.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Import all route files
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profileRoutes');
const booksRoutes = require('./routes/booksRoutes.js'); // Import main book routes
const socialRoutes = require('./routes/socialRoutes'); // Import social routes
const externalBooksRoutes = require('./routes/externalBooks.js'); // IMPORT YOUR EXTERNAL BOOKS ROUTE - Added .js extension
const recommendationRoutes = require('./routes/recommendations'); // IMPORT YOUR RECOMMENDATIONS ROUTE (assuming this file exists)

// Use all routes
app.use('/api/auth', authRoutes); // All authentication related routes will start with /api/auth
app.use('/api/profile', profileRoutes); // All profile related routes will start with /api/profile

// TEMPORARY DEBUGGING ROUTE: Place this BEFORE app.use('/api/books', booksRoutes)
// This will log if any request hits /api/books, regardless of method or authentication
app.use('/api/books', (req, res, next) => {
    console.log(`Backend: Request received for /api/books path. Method: ${req.method}, URL: ${req.originalUrl}`);
    next(); // Pass control to the next middleware/route
});

// Log before mounting books routes to confirm execution order
console.log('Backend: Mounting /api/books routes...');
app.use('/api/books', booksRoutes); // Use main book routes (e.g., for CRUD operations on your list)
app.use('/api/social', socialRoutes); // Use social routes

// IMPORTANT: Mount your external search and recommendations routes
// They should be mounted under '/api/books' if their internal paths are relative (e.g., '/')
app.use('/api/books', externalBooksRoutes); // Mount external search under /api/books
app.use('/api/books', recommendationRoutes); // Mount recommendations under /api/books

// Test route - A simple route to check if the server is running
app.get('/', (req, res) => {
    res.send('📚 BookHub API is running');
});

// GLOBAL ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// This catches any errors passed with next(err) or unhandled errors in async routes
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack); // Log the full stack trace of the error
    // Ensure all errors return JSON, not HTML
    res.status(err.statusCode || 500).json({
        msg: err.message || 'An unexpected server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.stack : {} // Send stack in dev mode
    });
});


// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI, {
    // These options are deprecated in newer Mongoose versions but often included for compatibility
    // useNewUrlParser: true,
    // useUnifiedTopology: true
})
    .then(() => {
        // Only start the server if MongoDB connection is successful
        const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000
        app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
        console.log('🎉 MongoDB connected successfully!'); // Confirmation message
    })
    .catch((err) => {
        // Log any connection errors
        console.error('❌ MongoDB connection error:', err);
        // Optionally, exit the process if DB connection fails on startup
        // process.exit(1);
    });

// Export the app for testing or other modules if needed
module.exports = app;
