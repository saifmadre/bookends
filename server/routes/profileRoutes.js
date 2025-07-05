// server/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware'); // Middleware for token verification
const User = require('../models/User'); // User model
const bcrypt = require('bcryptjs'); // Needed for password comparison/hashing if you integrate it here, but typically for authRoutes

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private (requires authentication)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/profile/update
// @desc    Update user's profile information (username, email)
// @access  Private (requires authentication)
router.put('/update', authenticateToken, async (req, res) => {
    const { username, email } = req.body;

    // Simple validation for update fields
    if (!username || !email) {
        return res.status(400).json({ msg: 'Username and email are required for update' });
    }

    try {
        let user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if new email/username already exists for *other* users
        if (email !== user.email) {
            const existingEmailUser = await User.findOne({ email });
            if (existingEmailUser && existingEmailUser.id.toString() !== user.id.toString()) {
                return res.status(400).json({ msg: 'Email already in use by another account' });
            }
        }
        if (username !== user.username) {
            const existingUsernameUser = await User.findOne({ username });
            if (existingUsernameUser && existingUsernameUser.id.toString() !== user.id.toString()) {
                return res.status(400).json({ msg: 'Username already taken' });
            }
        }

        // Update user fields
        user.username = username;
        user.email = email;

        await user.save();

        // Return updated user data (excluding password)
        res.json({ msg: 'Profile updated successfully', user: { id: user.id, username: user.username, email: user.email } });

    } catch (err) {
        console.error(err.message);
        // Specific error handling for duplicate key (e.g., if unique constraint violated unexpectedly)
        if (err.code === 11000) { // MongoDB duplicate key error code
            return res.status(400).json({ msg: 'Username or email already exists' });
        }
        res.status(500).send('Server error during profile update');
    }
});

// @route   DELETE /api/profile/delete-account
// @desc    Delete the authenticated user's account
// @access  Private (requires authentication)
router.delete('/delete-account', authenticateToken, async (req, res) => {
    try {
        // Find the user by ID from the authenticated token and delete
        const user = await User.findByIdAndDelete(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'Account deleted successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error during account deletion');
    }
});

module.exports = router;
