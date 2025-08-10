// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // Enforce minimum password length
    },
    phoneNumber: {
        type: String,
        required: false, // Optional field
        trim: true,
        // You might want to add a regex for phone number validation here
    },
    date: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Define allowed roles
        default: 'user'
    },
    // Social features:
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' // References the User model itself
        }
    ],
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    pendingFollowRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    // NEW PROFILE FIELDS:
    profileImage: { // Stores the URL/path to the profile image
        type: String,
        default: null // Default to null if no image is set
    },
    bio: {
        type: String,
        maxlength: 500, // Max length for bio
        default: ''
    },
    socialLinks: { // Object to store various social media URLs
        goodreads: {
            type: String,
            default: ''
        },
        twitter: {
            type: String,
            default: ''
        },
        instagram: {
            type: String,
            default: ''
        }
        // Add more social links as needed
    }
});

module.exports = mongoose.model('User', UserSchema);