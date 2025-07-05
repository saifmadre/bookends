// server/routes/externalBooks.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware'); // Import your authentication middleware
const fetch = require('node-fetch'); // Import node-fetch for making HTTP requests

// @route   GET /api/books/external-search
// @desc    Search for books using an external API (e.g., Google Books)
// @access  Private (requires authentication token)
router.get('/external-search', authenticateToken, async (req, res) => {
    // Extract the search query from the request's query parameters
    let searchQuery = req.query.query; // Use 'let' because we might reassign for suggestions

    // If no search query is provided, use a default for suggestions
    if (!searchQuery) {
        searchQuery = "fiction best sellers"; // Default query for suggested books
        console.log('Backend: No search query provided, defaulting to:', searchQuery);
    }

    try {
        // Construct the Google Books API URL
        // Using 'q' for general query, and 'maxResults' to limit the number of results
        // You can add more parameters as needed (e.g., 'inauthor', 'intitle', 'subject')
        // IMPORTANT: If you are using a Google Books API key, ensure it's included here.
        // const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY; // Uncomment and set this in your .env
        // const googleBooksApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=20`;
        const googleBooksApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20`;


        // Make a request to the Google Books API
        const response = await fetch(googleBooksApiUrl);

        // Check content type before attempting to parse as JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text(); // Read as text to log
            console.error('Google Books API returned non-JSON content. Status:', response.status, 'Content-Type:', contentType, 'Response Body:', textResponse.substring(0, 500)); // Log first 500 chars
            return res.status(500).json({ msg: 'External API returned non-JSON response. Check backend logs for details.' });
        }

        const data = await response.json(); // Now it's safer to parse as JSON

        // Check if the Google Books API returned an error (e.g., 4xx or 5xx status)
        if (!response.ok) {
            console.error('Google Books API error:', data);
            // Ensure the error message from Google Books API is passed through as JSON
            return res.status(response.status).json({ msg: data.error?.message || 'Failed to fetch from external book API.' });
        }

        // Process the data received from Google Books API
        // We want to extract relevant information and format it consistently
        const books = data.items ? data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            return {
                id: item.id, // Google Books ID
                title: volumeInfo.title || 'N/A',
                author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'N/A',
                description: volumeInfo.description || 'No description available.',
                genre: volumeInfo.categories ? volumeInfo.categories.join(', ') : 'General',
                coverImageUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || 'https://placehold.co/100x150/FDF8ED/5A4434?text=No+Cover',
                publishedDate: volumeInfo.publishedDate || 'N/A',
                pageCount: volumeInfo.pageCount || 0,
                averageRating: volumeInfo.averageRating || 0,
                ratingsCount: volumeInfo.ratingsCount || 0,
                // Add other fields if necessary
            };
        }) : []; // If no items, return an empty array to ensure it's always an array

        // Send the processed book data back to the client as JSON
        res.json(books);

    } catch (err) {
        // This catch block handles any unexpected errors during the fetch or processing
        console.error('Server error during external book search:', err.message);
        // CRITICAL FIX: Ensure this error response is also JSON
        res.status(500).json({ msg: 'Server Error during external book search. Check backend logs for details.' });
    }
});

module.exports = router;
