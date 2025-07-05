// server/routes/recommendations.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware'); // Assuming you use this for authentication

// @route   POST /api/books/recommendations
// @desc    Get book recommendations based on user's reading list or a seed book
// @access  Private (requires authentication token)
// CHANGED FROM router.get TO router.post TO MATCH FRONTEND REQUEST
router.post('/recommendations', authenticateToken, async (req, res) => {
    // This is a placeholder for your recommendation logic.
    // In a real application, you would:
    // 1. Receive myBooks and selectedSeedBook from the frontend (req.body)
    // 2. Use a recommendation algorithm (e.g., content-based, collaborative filtering)
    // 3. Fetch data from external APIs or your own database based on the algorithm
    // 4. Return a list of recommended books.

    console.log('Backend: /api/books/recommendations POST endpoint hit.'); // Updated log
    console.log('Received data for recommendations:', req.body);

    // For now, return an empty array or some dummy data
    // This ensures the frontend gets a valid JSON response and doesn't crash.
    try {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 500));

        // You can return some dummy recommendations for testing
        const dummyRecommendations = [
            {
                id: 'dummy-rec-1',
                title: 'The Alchemist',
                author: 'Paulo Coelho',
                description: 'A philosophical novel about a shepherd boy who travels in search of a treasure.',
                genre: 'Fiction, Philosophy',
                coverImageUrl: 'https://placehold.co/100x150/FDF8ED/5A4434?text=The+Alchemist',
                averageRating: 4.0,
                pageCount: 163,
                similarityScore: 90 // Dummy score
            },
            {
                id: 'dummy-rec-2',
                title: 'Sapiens: A Brief History of Humankind',
                author: 'Yuval Noah Harari',
                description: 'A brief history of humankind from the Stone Age to the twenty-first century.',
                genre: 'Non-Fiction, History',
                coverImageUrl: 'https://placehold.co/100x150/FDF8ED/5A4434?text=Sapiens',
                averageRating: 4.5,
                pageCount: 443,
                similarityScore: 85 // Dummy score
            }
        ];

        // Send a successful JSON response
        res.setHeader('Content-Type', 'application/json');
        res.json(dummyRecommendations);

    } catch (error) {
        console.error('Error in recommendations route:', error.message);
        // Always send a JSON error response
        res.status(500).json({ msg: 'Server error while generating recommendations.' });
    }
});

module.exports = router;
