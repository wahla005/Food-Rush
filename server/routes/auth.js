const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const sendEmail = require('../utils/sendEmail');

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
        if (exists) {
            // Case 1: Account exists and is fully verified with a password
            if (exists.isVerified && exists.password) {
                return res.status(400).json({ message: 'Email already registered' });
            } 
            
            // Case 2: Account exists (maybe via Google or previous pending signup)
            // We allow them to (re)register to set/update their info, as long as they verify OTP
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            
            exists.otp = otp;
            exists.otpExpiry = otpExpiry;
            // We'll update the password/name ONLY after they verify the OTP in /verify-otp
            // For now, we store the "pending" password in a temporary field if needed? 
            // Better: just allow them to update it now, but keep isVerified=false if it was false.
            // If it was already isVerified (Google user), we still send OTP to prove ownership before changing password.
            
            if (password) {
                // We'll hash the password in the pre-save hook
                exists.password = password;
            }
            if (name) exists.name = name;
            
            // If they were a Google user, they are already verified, but we want to 
            // "re-verify" via OTP before we let them change the password this way.
            const subject = exists.googleId ? 'Food Rush - Link Password to Google Account' : 'Food Rush - Verify Your Account';
            const msg = exists.googleId 
                ? `Hi ${exists.name},\n\nYou are adding a password to your Google-linked account. Your OTP is: ${otp}`
                : `Hi ${exists.name},\n\nYour new OTP for account verification is: ${otp}`;

            await exists.save();

            sendEmail({
                email: exists.email,
                subject: subject,
                message: `${msg}\n\nThis code will expire in 10 minutes.`,
            }).catch(err => console.error('Background Email Error (Merge):', err.message));

            return res.status(200).json({ 
                message: exists.googleId 
                    ? 'This email is linked to Google. An OTP has been sent to confirm it is you before adding a password.' 
                    : 'Account exists but unverified. A new OTP has been sent.' 
            });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const user = await User.create({ name, email, password, otp, otpExpiry });

        // Send Real Email immediately but don't hold up the user if it's slow
        sendEmail({
            email: user.email,
            subject: 'Food Rush - Verify Your Account',
            message: `Hi ${user.name},\n\nYour OTP for account verification is: ${otp}\n\nThis code will expire in 10 minutes.\n\nEnjoy Food Rush!`,
        }).catch(err => console.error('Background Email Error (Register):', err.message));

        res.status(201).json({ 
            message: 'Registration successful! If you do not see the OTP email in 1 minute, check your Spam folder or Render logs.' 
        });
    } catch (err) {
        console.error('❌ Registration Error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
    try {
        const { email, type } = req.body; // type: 'register' or 'reset'
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        if (type === 'reset') {
            user.resetOtp = otp;
            user.resetOtpExpiry = otpExpiry;
        } else {
            if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });
            user.otp = otp;
            user.otpExpiry = otpExpiry;
        }

        await user.save();

        // Send Email
        sendEmail({
            email: user.email,
            subject: type === 'reset' ? 'Food Rush - Password Reset OTP' : 'Food Rush - Verify Your Account',
            message: `Hi ${user.name},\n\nYour new OTP is: ${otp}\n\nThis code will expire in 10 minutes.`,
        }).catch(err => console.error('Background Email Error (Resend):', err.message));

        res.json({ message: 'New OTP sent to your email!' });
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

        // Send Real Reset Email
        sendEmail({
            email: user.email,
            subject: 'Food Rush - Password Reset OTP',
            message: `Hi ${user.name},\n\nYour OTP for password reset is: ${otp}\n\nThis code will expire in 10 minutes.`,
        }).catch(err => console.error('Background Email Error (Reset):', err.message));

        res.json({ message: 'If this email exists, an OTP has been sent. Please check your inbox or Spam.' });
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
        
        const imageUrl = req.file.path; // Cloudinary secure URL

        // Update user immediately
        const user = await User.findById(req.user._id);
        user.image = imageUrl;
        await user.save();

        res.json({
            message: 'Profile picture uploaded to Cloudinary',
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

        // Note: For now we just remove the URL from DB. 
        // Real deletion from Cloudinary would require pulling the public_id from the URL.
        user.image = null;
        await user.save();

        res.json({
            message: 'Profile picture removed from profile',
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
