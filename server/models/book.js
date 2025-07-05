// server/models/book.js
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', // References the 'user' model
        required: true // Each book must be associated with a user
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    genre: {
        type: String
    },
    coverImageUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['Planned', 'Reading', 'Finished'], // Restrict status to these values
        default: 'Planned'
    },
    currentPage: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPages: {
        type: Number,
        default: 0,
        min: 0 // A book should at least have 0 pages if not known
    },
    notes: {
        type: String
    },
    highlights: {
        type: String
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: null // Can be null if not rated yet
    },
    reviewText: {
        type: String
    },
    addedDate: {
        type: Date,
        default: Date.now // Automatically set the date when the book is added
    }
});

module.exports = mongoose.model('book', BookSchema); // Export as 'book'

