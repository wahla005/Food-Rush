const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: false,   // optional — Google OAuth users have no password
        default: null,
    },
    googleId: {
        type: String,
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        default: null,
    },
    otpExpiry: {
        type: Date,
        default: null,
    },
    resetOtp: {
        type: String,
        default: null,
    },
    resetOtpExpiry: {
        type: Date,
        default: null,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    image: {
        type: String,
        default: null,
    },
}, { timestamps: true });

// Hash password before save — skip if no password (Google OAuth users)
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare plain password with hashed one
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
