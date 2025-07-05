// server/models/User.js
const mongoose = require('mongoose');

// Define the User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: { // NEW: Phone number field
        type: String,
        unique: true, // Phone numbers should also be unique if provided
        sparse: true, // Allows null values, so users don't have to provide a phone number
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // --- NEW: Fields for Password Reset ---
    resetPasswordToken: {
        type: String,
        required: false // Not required for normal user creation
    },
    resetPasswordExpires: {
        type: Date,
        required: false // Not required for normal user creation
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    following: [
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
    ]
});

// Export the User model based on the schema
module.exports = mongoose.model('User', UserSchema);
