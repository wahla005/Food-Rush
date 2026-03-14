const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Storage for Profile Pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/profiles/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `profile-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for HD images
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'), false);
    }
});

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
        console.log(`🔑 Client login attempt for: ${email}`);

        if (!email || !password) {
            console.warn('⚠️ Missing email or password in login request');
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.warn(`❌ User not found: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            console.warn(`⚠️ User not verified: ${email}`);
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.warn(`❌ Password mismatch for: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`✅ Client logged in: ${email}`);
        const token = generateToken(user._id);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error('❌ Client Login Error:', err);
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
// POST /api/auth/upload  (protected)
router.post('/upload', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        // Update user immediately or just return URL? Let's update user.
        const user = await User.findById(req.user._id);
        user.image = imageUrl;
        await user.save();

        res.json({
            message: 'Image uploaded',
            imageUrl,
            user: { id: user._id, name: user.name, email: user.email, image: user.image }
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Upload failed' });
    }
});

// DELETE /api/auth/profile/image  (protected)
router.delete('/profile/image', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Remove file from filesystem if it exists
        if (user.image) {
            const filePath = path.join(__dirname, '..', user.image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        user.image = null;
        await user.save();

        res.json({
            message: 'Profile picture removed',
            user: { id: user._id, name: user.name, email: user.email, image: user.image }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/auth/profile  (protected)
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, image } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Name cannot be empty' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = name.trim();
        if (image !== undefined) user.image = image;

        await user.save();
        res.json({
            message: 'Profile updated',
            user: { id: user._id, name: user.name, email: user.email, image: user.image }
        });
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
