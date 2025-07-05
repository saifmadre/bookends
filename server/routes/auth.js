// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User'); // Ensure correct path to your User model
const config = require('config'); // Import the config package here
const { authenticateToken } = require('../middleware/authMiddleware'); // Import the auth middleware from authMiddleware.js
const nodemailer = require('nodemailer'); // Import nodemailer

// @route   GET api/auth
// @desc    Get user by token
// @access  Private (requires token)
// Use the destructured authenticateToken function directly
router.get('/', authenticateToken, async (req, res) => {
    try {
        // req.user.id is populated by the authenticateToken middleware
        const user = await User.findById(req.user.id).select('-password'); // Exclude password from response
        res.json(user);
    } catch (err) {
        console.error('Server error during GET /api/auth:', err.message);
        res.status(500).send('Server Error during authentication.');
    }
});


// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
    '/register',
    [
        check('username', 'Username is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        // Optional: Add specific validation for phone number if needed (e.g., isMobilePhone())
        // For now, just ensure it's a string if present.
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array()); // Log validation errors
            return res.status(400).json({ errors: errors.array(), msg: errors.array()[0].msg }); // Return first error message
        }

        const { username, email, phoneNumber, password } = req.body;

        try {
            // Check if user (by email or username or phone number) already exists
            // Removed .filter(Boolean) as Mongoose handles undefined/null gracefully in $or
            let user = await User.findOne({
                $or: [
                    { email: email.toLowerCase() }, // Ensure case-insensitive check for email
                    { username: username },
                    { phoneNumber: phoneNumber } // Will be ignored if phoneNumber is null/undefined
                ]
            });

            if (user) {
                // Determine which field caused the conflict
                if (user.email === email.toLowerCase()) { // Compare with lowercased email
                    return res.status(400).json({ msg: 'User with this email already exists.' });
                }
                if (user.username === username) {
                    return res.status(400).json({ msg: 'User with this username already exists.' });
                }
                if (user.phoneNumber && user.phoneNumber === phoneNumber) {
                    return res.status(400).json({ msg: 'User with this phone number already exists.' });
                }
            }

            // Create new user instance
            user = new User({
                username,
                email: email.toLowerCase(), // Store email in lowercase
                phoneNumber: phoneNumber || null, // Save phone number, allow null if not provided
                password
            });

            // Hash password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            // Save user to database - Added dedicated try/catch for potential save errors
            try {
                await user.save();
            } catch (saveError) {
                // Log the entire saveError object for detailed inspection
                console.error('Mongoose save error during registration (detailed):', saveError);
                if (saveError.code === 11000) { // Duplicate key error during save
                    const field = Object.keys(saveError.keyValue)[0];
                    return res.status(400).json({ msg: `A user with this ${field} already exists.` });
                }
                // Generic error for other save issues
                return res.status(500).send('Database save error during registration.');
            }


            // Return JWT
            const payload = {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: '5h' },
                (err, token) => {
                    if (err) {
                        console.error('JWT sign error (detailed):', err); // Log JWT specific errors
                        throw err; // Re-throw to be caught by the outer try/catch
                    }
                    res.json({ token });
                }
            );

        } catch (err) {
            // Log the entire error object for detailed inspection
            console.error('General server error during registration flow (detailed):', err);
            // This outer catch handles errors from JWT signing or other unexpected issues
            res.status(500).send('Server Error during registration.'); // Generic fallback for other errors
        }
    }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('identifier', 'Email or Phone Number is required').not().isEmpty(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Login validation errors:', errors.array()); // Log login validation errors
            return res.status(400).json({ errors: errors.array(), msg: errors.array()[0].msg });
        }

        const { identifier, password } = req.body;

        try {
            // Find user by email or phone number
            let user = await User.findOne({
                $or: [
                    { email: identifier.toLowerCase() }, // Check lowercased email
                    { phoneNumber: identifier }
                ]
            });

            if (!user) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // Generate Access Token
            const accessToken = jwt.sign(
                { user: { id: user.id, username: user.username, email: user.email, role: user.role } },
                config.get('jwtSecret'),
                { expiresIn: '15m' } // Short-lived access token
            );

            // Longer-lived refresh token (expiry can be controlled by rememberMe flag if passed from frontend)
            const refreshTokenExpiry = req.body.rememberMe ? '30d' : '1h';
            const refreshToken = jwt.sign(
                { user: { id: user.id } }, // Refresh token usually contains minimal info
                config.get('jwtSecret'), // You should use a separate JWT_REFRESH_SECRET here for better security
                { expiresIn: refreshTokenExpiry }
            );

            // FIX: Ensure the accessToken is sent as 'token' so AuthContext can pick it up correctly
            res.json({ token: accessToken, refreshToken }); // <--- CHANGED FROM { accessToken, refreshToken }

        } catch (err) {
            console.error('Server error during login (detailed):', err); // Log specific login errors
            res.status(500).send('Server Error during login.');
        }
    }
);

// @route   POST api/auth/forgot-password
// @desc    Request password reset link
// @access  Public
router.post(
    '/forgot-password',
    check('email', 'Please include a valid email').isEmail(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array(), msg: errors.array()[0].msg });
        }

        const { email } = req.body;

        try {
            const user = await User.findOne({ email: email.toLowerCase() });

            // IMPORTANT: Send a generic success message to prevent email enumeration
            if (!user) {
                return res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
            }

            // Generate a unique token for password reset
            const resetToken = jwt.sign({ id: user.id }, config.get('JWT_RESET_SECRET'), { expiresIn: '1h' });

            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            await user.save();

            // Create email transporter
            const transporter = nodemailer.createTransport({
                service: config.get('EMAIL_SERVICE'), // e.g., 'Gmail'
                auth: {
                    user: config.get('EMAIL_USER'),   // Your email
                    pass: config.get('EMAIL_PASS')    // Your app password
                }
            });

            const mailOptions = {
                to: user.email,
                from: config.get('EMAIL_USER'),
                subject: 'Password Reset for BookEnds',
                html: `
                    <p>You are receiving this because you (or someone else) has requested the reset of the password for your account.</p>
                    <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                    <p><a href="${config.get('FRONTEND_URL')}/reset-password?token=${resetToken}">Reset Password Link</a></p>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Nodemailer error:', error);
                    // Still send generic success to frontend even if email sending fails internally
                    return res.status(500).json({ msg: 'Error sending email. Please try again later.' });
                }
                console.log('Reset email sent: ' + info.response);
                res.status(200).json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
            });

        } catch (err) {
            console.error('Server error during forgot password:', err.message);
            res.status(500).send('Server Error during password reset request.');
        }
    }
);

// @route   POST api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password',
    [
        check('token', 'Token is required').not().isEmpty(),
        check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array(), msg: errors.array()[0].msg });
        }

        const { token, newPassword } = req.body;

        try {
            const decoded = jwt.verify(token, config.get('JWT_RESET_SECRET'));
            const user = await User.findOne({
                _id: decoded.id,
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() } // Token must not be expired
            });

            if (!user) {
                return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

            // Clear reset token fields
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({ msg: 'Password has been reset successfully.' });

        } catch (err) {
            console.error('Server error during password reset:', err.message);
            if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
                return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
            }
            res.status(500).send('Server Error during password reset.');
        }
    }
);

module.exports = router;
