const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: generate JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─────────────────────────────────────────────
// POST /api/auth/google
// Frontend sends: { googleId, email, name } (already verified via Google's userinfo API)
// ─────────────────────────────────────────────
router.post('/google', async (req, res) => {
    try {
        const { googleId, email, name } = req.body;
        if (!googleId || !email) return res.status(400).json({ message: 'Google info missing' });

        // Find existing user by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // Link googleId if this email existed before (regular signup)
            if (!user.googleId) {
                user.googleId = googleId;
                user.isVerified = true;
                await user.save();
            }
        } else {
            // Brand new Google user — auto-create without password
            user = await User.create({
                name,
                email,
                googleId,
                isVerified: true,   // Google already verified the email
                password: null,
            });
        }

        const token = generateToken(user._id);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error('Google auth error:', err.message);
        res.status(401).json({ message: 'Google authentication failed' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields are required' });

        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ message: 'Email already registered' });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const user = await User.create({ name, email, password, otp, otpExpiry });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧  OTP for ${email}`);
        console.log(`🔑  Your OTP: ${otp}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.status(201).json({ message: 'OTP sent. Please verify your account.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

        if (user.otp !== otp || user.otpExpiry < new Date())
            return res.status(400).json({ message: 'Invalid or expired OTP' });

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        res.json({ message: 'Account verified successfully! Please login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'All fields are required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        if (!user.isVerified)
            return res.status(401).json({ message: 'Please verify your email first' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(user._id);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email' });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.resetOtp = otp;
        user.resetOtpExpiry = otpExpiry;
        await user.save();

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔐  Password Reset OTP for ${email}`);
        console.log(`🔑  Your OTP: ${otp}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({ message: 'OTP sent to your email (check server terminal).' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/verify-reset-otp
// ─────────────────────────────────────────────
router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.resetOtp !== otp || user.resetOtpExpiry < new Date())
            return res.status(400).json({ message: 'Invalid or expired OTP' });

        res.json({ message: 'OTP verified. Set your new password.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.resetOtp !== otp || user.resetOtpExpiry < new Date())
            return res.status(400).json({ message: 'Invalid or expired OTP' });

        user.password = newPassword;
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        await user.save();

        res.json({ message: 'Password reset successfully! Please login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user });
});

// ─────────────────────────────────────────────
// PUT /api/auth/profile  (protected)
// ─────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.name = req.body.name || user.name;
        await user.save();
        res.json({ message: 'Profile updated', user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/auth/change-password  (protected)
// ─────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
