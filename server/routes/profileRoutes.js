// server/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User'); // Assuming your User model is here
const Book = require('../models/book'); // Import the Book model to query user's books
const multer = require('multer'); // Import multer
const path = require('path'); // Node.js path module for file paths
const fs = require('fs'); // Node.js file system module for deleting files

// --- Multer Storage Configuration ---
// Define where to store the files and how to name them
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create an 'uploads' directory if it doesn't exist
        const uploadPath = path.join(__dirname, '../uploads/profile_images');
        fs.mkdirSync(uploadPath, { recursive: true }); // Create directory if it doesn't exist
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Use the user's ID and a timestamp to create a unique filename
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Filter to allow only image files
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize multer upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB file size limit (consistent with frontend)
    }
});

// @route   GET /api/profile
// @desc    Get current user's profile and reading statistics
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Find user by ID and explicitly select all relevant fields, including new ones
        const userProfile = await User.findById(req.user.id).select('username email phoneNumber date role following followers pendingFollowRequests profileImage bio socialLinks');

        if (!userProfile) {
            return res.status(404).json({ msg: 'User profile not found.' });
        }

        // --- Calculate Reading Statistics ---
        const userBooks = await Book.find({ user: req.user.id });

        let booksFinished = 0;
        let totalRating = 0;
        let ratedBooksCount = 0;
        const genreCounts = {};

        userBooks.forEach(book => {
            if (book.status === 'Finished') {
                booksFinished++;
                if (book.rating !== null && book.rating !== undefined) {
                    totalRating += book.rating;
                    ratedBooksCount++;
                }
            }
            if (book.genre) {
                // Split genre string by comma and trim whitespace, then count each
                book.genre.split(',').forEach(g => {
                    const trimmedGenre = g.trim();
                    if (trimmedGenre) {
                        genreCounts[trimmedGenre] = (genreCounts[trimmedGenre] || 0) + 1;
                    }
                });
            }
        });

        const averageRating = ratedBooksCount > 0 ? (totalRating / ratedBooksCount).toFixed(1) : 'N/A';

        let favoriteGenre = 'N/A';
        let maxGenreCount = 0;
        for (const genre in genreCounts) {
            if (genreCounts[genre] > maxGenreCount) {
                maxGenreCount = genreCounts[genre];
                favoriteGenre = genre;
            }
        }

        // Combine user profile data with calculated statistics
        const profileWithStats = {
            ...userProfile.toObject(), // Convert Mongoose document to plain JavaScript object
            booksFinished,
            averageRating,
            favoriteGenre
        };

        console.log('ProfileRoutes: GET /api/profile - Sending user profile with stats:', profileWithStats); // Log what's being sent
        res.json(profileWithStats);
    } catch (err) {
        console.error('Error fetching user profile or calculating stats:', err.message);
        res.status(500).json({ msg: 'Server error fetching profile or calculating stats.' });
    }
});

// NEW: @route   GET /api/profile/:id
// NEW: @desc    Get a specific user's public profile and reading statistics by ID
// NEW: @access  Private (for now, requires authentication, but could be public)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToFetch = req.params.id;

        // Find user by ID and explicitly select only public fields
        const userProfile = await User.findById(userIdToFetch).select('username date role profileImage bio socialLinks');

        if (!userProfile) {
            return res.status(404).json({ msg: 'User profile not found.' });
        }

        // --- Calculate Reading Statistics for the fetched user ---
        const userBooks = await Book.find({ user: userIdToFetch });

        let booksFinished = 0;
        let totalRating = 0;
        let ratedBooksCount = 0;
        const genreCounts = {};

        userBooks.forEach(book => {
            if (book.status === 'Finished') {
                booksFinished++;
                if (book.rating !== null && book.rating !== undefined) {
                    totalRating += book.rating;
                    ratedBooksCount++;
                }
            }
            if (book.genre) {
                book.genre.split(',').forEach(g => {
                    const trimmedGenre = g.trim();
                    if (trimmedGenre) {
                        genreCounts[trimmedGenre] = (genreCounts[trimmedGenre] || 0) + 1;
                    }
                });
            }
        });

        const averageRating = ratedBooksCount > 0 ? (totalRating / ratedBooksCount).toFixed(1) : 'N/A';

        let favoriteGenre = 'N/A';
        let maxGenreCount = 0;
        for (const genre in genreCounts) {
            if (genreCounts[genre] > maxGenreCount) {
                maxGenreCount = genreCounts[genre];
                favoriteGenre = genre;
            }
        }

        // Combine user profile data with calculated statistics
        const profileWithStats = {
            ...userProfile.toObject(),
            booksFinished,
            averageRating,
            favoriteGenre
        };

        console.log(`ProfileRoutes: GET /api/profile/${userIdToFetch} - Sending public user profile with stats:`, profileWithStats);
        res.json(profileWithStats);

    } catch (err) {
        console.error(`Error fetching user profile for ID ${req.params.id}:`, err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid User ID format.' });
        }
        res.status(500).json({ msg: 'Server error fetching public profile.' });
    }
});


// @route   PUT /api/profile/update
// @desc    Update user profile (including avatar, bio, social links)
// @access  Private
router.put('/update', authenticateToken, upload.single('profileImage'), async (req, res) => {
    // 'profileImage' is the field name expected from the frontend FormData
    console.log('ProfileRoutes: /api/profile/update hit.');
    console.log('ProfileRoutes: req.body (text fields):', req.body);
    console.log('ProfileRoutes: req.file (uploaded file object from multer):', req.file); // Log the multer file object

    try {
        const { username, email, bio, socialLinks } = req.body;
        const userId = req.user.id;

        // Basic validation for required fields
        if (!username || !email) {
            console.log('ProfileRoutes: Validation failed - Username or email missing.');
            return res.status(400).json({ msg: 'Username and email are required for update.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log('ProfileRoutes: User not found for ID:', userId);
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Log current user data before update
        console.log('ProfileRoutes: User data BEFORE update:', user.toObject());


        // Update fields
        user.username = username;
        user.email = email;
        user.bio = bio || ''; // Ensure bio is updated, default to empty string if not provided

        // Parse socialLinks if it's a JSON string
        if (socialLinks) {
            try {
                user.socialLinks = JSON.parse(socialLinks);
            } catch (parseError) {
                console.error('ProfileRoutes: Error parsing socialLinks:', parseError);
                return res.status(400).json({ msg: 'Invalid social links format.' });
            }
        } else {
            user.socialLinks = {}; // Ensure it's an empty object if not provided
        }

        // Handle profile image upload
        if (req.file) {
            console.log('ProfileRoutes: New file detected. Originalname:', req.file.originalname, 'Path:', req.file.path);

            // If an old profile image exists, delete it
            if (user.profileImage) {
                const oldImagePath = path.join(__dirname, '../uploads/profile_images', path.basename(user.profileImage));
                console.log('ProfileRoutes: Attempting to delete old image at:', oldImagePath);
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error('ProfileRoutes: Error deleting old profile image:', err);
                        // Log error but don't stop the update process
                    } else {
                        console.log('ProfileRoutes: Old profile image deleted successfully.');
                    }
                });
            }
            // Store the path to the new image (relative to server root or full URL if served statically)
            user.profileImage = `/uploads/profile_images/${req.file.filename}`;
            console.log('ProfileRoutes: New profileImage URL set in Mongoose object:', user.profileImage);
        } else {
            console.log('ProfileRoutes: No new file uploaded in this request.');
            // IMPORTANT: If no new file is uploaded, we should NOT clear the existing profileImage
            // user.profileImage remains whatever it was before this request.
        }

        await user.save();
        console.log('ProfileRoutes: User data AFTER save (from Mongoose object):', user.toObject());


        // Re-fetch user data from DB to ensure we get the latest persisted state
        const updatedUser = await User.findById(userId).select('username email phoneNumber date role following followers pendingFollowRequests profileImage bio socialLinks');
        console.log('ProfileRoutes: User data RE-FETCHED from DB after save:', updatedUser);

        res.json({ msg: 'Profile updated successfully!', user: updatedUser });

    } catch (err) {
        console.error('ProfileRoutes: Error updating profile:', err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: 'File size too large. Max 2MB allowed.' });
        }
        res.status(500).json({ msg: 'Server error updating profile.' });
    }
});


module.exports = router;