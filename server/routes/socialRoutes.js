// server/routes/socialRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User'); // Ensure correct casing

// @route   POST /api/social/follow/:id
// @desc    Send a follow request to another user
// @access  Private
router.post('/follow/:id', authenticateToken, async (req, res) => {
    try {
        const targetUserId = req.params.id; // User to be followed
        const currentUserId = req.user.id;   // User sending the request

        if (targetUserId === currentUserId) {
            return res.status(400).json({ msg: 'You cannot follow yourself.' });
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Check if already following
        if (currentUser.following.includes(targetUserId)) {
            return res.status(400).json({ msg: 'You are already following this user.' });
        }

        // Check if a follow request is already pending
        if (targetUser.pendingFollowRequests.includes(currentUserId)) {
            return res.status(400).json({ msg: 'Follow request already sent.' });
        }

        // Add current user to target user's pending requests
        targetUser.pendingFollowRequests.push(currentUserId);
        await targetUser.save();

        res.json({ msg: 'Follow request sent.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error sending follow request.');
    }
});

// @route   POST /api/social/accept-follow/:id
// @desc    Accept a pending follow request
// @access  Private
router.post('/accept-follow/:id', authenticateToken, async (req, res) => {
    try {
        const requesterId = req.params.id;   // User who sent the request
        const currentUserId = req.user.id;   // User accepting the request

        const requester = await User.findById(requesterId);
        const currentUser = await User.findById(currentUserId);

        if (!requester || !currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Check if there is a pending request from the requester
        if (!currentUser.pendingFollowRequests.includes(requesterId)) {
            return res.status(400).json({ msg: 'No pending follow request from this user.' });
        }

        // Remove from pending requests
        currentUser.pendingFollowRequests = currentUser.pendingFollowRequests.filter(
            (id) => id.toString() !== requesterId
        );

        // Add to followers list for current user
        currentUser.followers.push(requesterId);

        // Add to following list for requester
        requester.following.push(currentUserId);

        await currentUser.save();
        await requester.save();

        res.json({ msg: 'Follow request accepted.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error accepting follow request.');
    }
});

// @route   POST /api/social/reject-follow/:id
// @desc    Reject a pending follow request
// @access  Private
router.post('/reject-follow/:id', authenticateToken, async (req, res) => {
    try {
        const requesterId = req.params.id;   // User who sent the request
        const currentUserId = req.user.id;   // User rejecting the request

        const currentUser = await User.findById(currentUserId);

        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Check if there is a pending request from the requester
        if (!currentUser.pendingFollowRequests.includes(requesterId)) {
            return res.status(400).json({ msg: 'No pending follow request from this user.' });
        }

        // Remove from pending requests
        currentUser.pendingFollowRequests = currentUser.pendingFollowRequests.filter(
            (id) => id.toString() !== requesterId
        );
        await currentUser.save();

        res.json({ msg: 'Follow request rejected.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error rejecting follow request.');
    }
});


// @route   POST /api/social/unfollow/:id
// @desc    Unfollow a user
// @access  Private
router.post('/unfollow/:id', authenticateToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;   // User to be unfollowed
        const currentUserId = req.user.id;   // User unfollowing

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Check if currently following
        if (!currentUser.following.includes(targetUserId)) {
            return res.status(400).json({ msg: 'You are not following this user.' });
        }

        // Remove from current user's following list
        currentUser.following = currentUser.following.filter(
            (id) => id.toString() !== targetUserId
        );
        // Remove current user from target user's followers list
        targetUser.followers = targetUser.followers.filter(
            (id) => id.toString() !== currentUserId
        );

        await currentUser.save();
        await targetUser.save();

        res.json({ msg: 'User unfollowed successfully.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error unfollowing user.');
    }
});


// @route   GET /api/social/following
// @desc    Get users that the current user is following
// @access  Private
router.get('/following', authenticateToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id).populate('following', 'username email'); // Populate 'following' with username and email
        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        res.json(currentUser.following);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error fetching following list.');
    }
});

// @route   GET /api/social/followers
// @desc    Get users that are following the current user
// @access  Private
router.get('/followers', authenticateToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id).populate('followers', 'username email'); // Populate 'followers'
        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        res.json(currentUser.followers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error fetching followers list.');
    }
});

// @route   GET /api/social/pending-requests
// @desc    Get pending follow requests for the current user
// @access  Private
router.get('/pending-requests', authenticateToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id).populate('pendingFollowRequests', 'username email');
        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        res.json(currentUser.pendingFollowRequests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error fetching pending follow requests.');
    }
});

// NEW: @route   GET /api/social/users
// NEW: @desc    Get all users (excluding the current user) for discovery
// NEW: @access  Private (only authenticated users can discover other users)
router.get('/users', authenticateToken, async (req, res) => {
    console.log('SocialRoutes: /api/social/users route hit.'); // Log when this route is accessed
    console.log('SocialRoutes: req.user after authenticateToken:', req.user); // Check if req.user is populated

    try {
        const currentUserId = req.user.id;
        // Find all users except the current user, select only relevant fields
        const users = await User.find({ _id: { $ne: currentUserId } }).select('username email');
        console.log('SocialRoutes: Fetched users successfully. Count:', users.length);
        res.json(users);
    } catch (err) {
        console.error('SocialRoutes: Error fetching users for discovery:', err.message);
        res.status(500).send('Server error fetching users for discovery.');
    }
});


module.exports = router;
