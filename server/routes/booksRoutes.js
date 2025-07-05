// server/routes/booksRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware'); // For protecting routes
const Book = require('../models/book'); // Import the Book model
console.log('Backend: Book model imported:', Book ? 'Success' : 'Failed'); // ADDED LOG for Book model
require('dotenv').config(); // Load environment variables
const fetch = require('node-fetch'); // For making HTTP requests (though not used in these specific routes anymore)

// @route   POST /api/books
// @desc    Add a new book to YOUR database (with all new fields)
// @access  Private (only authenticated users can add books)
router.post('/', authenticateToken, async (req, res) => {
    // Destructure all expected fields from the request body
    const { title, author, description, genre, coverImageUrl, status,
        currentPage, totalPages, notes, highlights, rating, reviewText } = req.body;

    // Basic validation
    if (!title || !author) {
        return res.status(400).json({ msg: 'Title and Author are required to add a book.' });
    }

    try {
        const newBook = new Book({
            title,
            author,
            description,
            genre,
            coverImageUrl,
            status,
            user: req.user.id, // Associate the book with the logged-in user
            currentPage: currentPage || 0, // Default to 0 if not provided
            totalPages: totalPages || 0,   // Default to 0 if not provided
            notes: notes || '',
            highlights: highlights || '',
            rating: rating !== undefined && rating !== null ? rating : null, // Handle null for initial rating
            reviewText: reviewText || ''
        });

        const book = await newBook.save();
        res.status(201).json({ msg: 'Book added successfully!', book }); // Return the created book
    } catch (err) {
        console.error(`Error in POST /api/books: ${err.message}`);
        // CRITICAL FIX: Ensure JSON response
        res.status(500).json({ msg: 'Server error while adding book' });
    }
});

// @route   GET /api/books
// @desc    Get all books from YOUR database for the authenticated user, with optional search
// @access  Private (only authenticated users can view their own books)
// IMPORTANT: This route is now protected to fetch only the current user's books
router.get('/', authenticateToken, async (req, res) => {
    console.log('Backend: Request to /api/books received'); // ADDED TEMPORARY LOG
    try {
        const { search } = req.query; // Get the search query parameter
        let query = { user: req.user.id }; // Filter by authenticated user's ID

        if (search) {
            // Add search criteria to the query
            const searchRegex = new RegExp(search, 'i');
            query.$or = [ // Use $or to search title OR author within the user's books
                { title: { $regex: searchRegex } },
                { author: { $regex: searchRegex } }
            ];
        }

        // Fetch books for the authenticated user, sorted by most recently added
        const books = await Book.find(query).sort({ addedDate: -1 });
        console.log('Backend: GET /api/books - Books fetched (type):', typeof books, 'value:', books); // More detailed log
        console.log('Backend: GET /api/books - Books stringified:', JSON.stringify(books)); // Stringify to confirm JSON validity

        res.json(books);
    } catch (err) {
        console.error(`Error in GET /api/books: ${err.message}`);
        // CRITICAL FIX: Ensure JSON response
        res.status(500).json({ msg: 'Server error while fetching books' });
    }
});

// @route   PUT /api/books/:id
// @desc    Update a book in YOUR database (including new fields)
// @access  Private (only authenticated users can update their own books)
router.put('/:id', authenticateToken, async (req, res) => {
    // Destructure all possible updatable fields from the request body
    const { title, author, description, genre, coverImageUrl, status,
        currentPage, totalPages, notes, highlights, rating, reviewText } = req.body;

    // Build the update object, only including fields that are present in the request body
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (author !== undefined) updateFields.author = author;
    if (description !== undefined) updateFields.description = description;
    if (genre !== undefined) updateFields.genre = genre;
    if (coverImageUrl !== undefined) updateFields.coverImageUrl = coverImageUrl;
    if (status !== undefined) updateFields.status = status;
    if (currentPage !== undefined) updateFields.currentPage = currentPage;
    if (totalPages !== undefined) updateFields.totalPages = totalPages;
    if (notes !== undefined) updateFields.notes = notes;
    if (highlights !== undefined) updateFields.highlights = highlights;
    // Special handling for rating: allow setting to null
    if (rating !== undefined) {
        updateFields.rating = rating === null ? null : parseFloat(rating);
    }
    if (reviewText !== undefined) updateFields.reviewText = reviewText;

    try {
        let book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ msg: 'Book not found' });
        }

        // Ensure the book belongs to the authenticated user
        if (book.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to update this book' });
        }

        // Use findByIdAndUpdate and set { new: true } to return the updated document
        book = await Book.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true } // Return updated doc and run schema validators
        );

        res.json({ msg: 'Book updated successfully!', book });

    } catch (err) {
        console.error(`Error in PUT /api/books/:id route: ${err.message}`);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Book ID' });
        }
        // CRITICAL FIX: Ensure JSON response
        res.status(500).json({ msg: 'Server error during book update' });
    }
});


// @route   DELETE /api/books/:id
// @desc    Delete a book from YOUR database
// @access  Private (only authenticated users can delete their own books)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        let book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ msg: 'Book not found' });
        }

        // Ensure the book belongs to the authenticated user
        if (book.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to delete this book' });
        }

        await Book.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Book removed from list' });

    } catch (err) {
        console.error(`Error in DELETE /api/books/:id route: ${err.message}`);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Book ID' });
        }
        // CRITICAL FIX: Ensure JSON response
        res.status(500).json({ msg: 'Server error during book deletion' });
    }
});

// Removed the /external-search and /recommendations routes from here.
// These routes should be defined ONLY in their respective files:
// server/routes/externalBooks.js and server/routes/recommendations.js

module.exports = router;
