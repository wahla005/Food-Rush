const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');
const FoodItem = require('../models/FoodItem');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const { adminProtect, ADMIN_JWT_SECRET } = require('../middleware/adminAuth');
const { upload } = require('../config/cloudinary');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// ---------------------------------------------
// Hardcoded admin credentials
// ---------------------------------------------
const ADMIN_EMAIL = 'fwahla970@gmail.com';
const ADMIN_PASSWORD = 'faizan123';

// POST /api/admin/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Admin login attempt for: ${email}`);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    // 1. Check if Admin exists in database
    console.log(`Checking DB for admin: ${email}`);
    let adminUser = await User.findOne({ email, role: 'admin' });

    if (adminUser) {
        process.stdout.write(`Admin found in DB. Comparing passwords... `);
        const isMatch = await adminUser.matchPassword(password);
        if (!isMatch) {
            console.log('MATCH FAILED');
            console.warn(`Admin login failed (DB): ${email}`);
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        console.log('MATCH SUCCESS');
    } else {
        process.stdout.write(`Admin NOT found in DB. Checking hardcoded fallback... `);
        // 2. Fallback to hardcoded admin for first-time migration
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            console.log('HARDCODED MATCH');
            console.log(`Initial admin login detected. Checking if user exists with this email...`);
            
            // Check if ANY user exists with this email (e.g. regular user)
            let existingUser = await User.findOne({ email: ADMIN_EMAIL });
            
            if (existingUser) {
                console.log(`Existing user found. Promoting to Admin role...`);
                existingUser.role = 'admin';
                existingUser.password = ADMIN_PASSWORD; // Set the default password if they had none (Google) or update it
                existingUser.isVerified = true;
                await existingUser.save();
                adminUser = existingUser;
            } else {
                console.log(`No user found. Creating brand new Admin...`);
                adminUser = await User.create({
                    name: 'Admin',
                    email: ADMIN_EMAIL,
                    password: ADMIN_PASSWORD,
                    role: 'admin',
                    isVerified: true
                });
            }
        } else {
            console.log('HARDCODED FAILED');
            console.warn(`Admin login failed (Hardcoded/Not Found): ${email}`);
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
    }

    console.log(`Admin logged in: ${email}`);
    const token = jwt.sign({ email: adminUser.email, role: 'admin', id: adminUser._id }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { email: adminUser.email, name: adminUser.name } });
});

// PUT /api/admin/change-password
router.put('/change-password', adminProtect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new passwords are required' });
        }

        // adminProtect attaches decoded token to req.admin
        const admin = await User.findOne({ email: req.admin.email, role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Admin user not found in database' });

        const isMatch = await admin.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        admin.password = newPassword;
        await admin.save();

        console.log(`Admin password changed for: ${admin.email}`);
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Admin Password Change Error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// POST /api/admin/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin) {
            // Security: don't reveal if admin exists, but for the one hardcoded admin it's fine
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        admin.resetOtp = otp;
        admin.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await admin.save();

        // Send email
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #f97316;">Admin Password Reset</h2>
                <p>Hello Admin,</p>
                <p>Your OTP for resetting your password is:</p>
                <div style="background: #fdf2f2; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; color: #f97316; letter-spacing: 5px;">
                    ${otp}
                </div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <p>If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">This is an automated message from FoodApp Admin Portal.</p>
            </div>
        `;

        await sendEmail({
            email: admin.email,
            subject: 'Admin Password Reset OTP',
            message
        });

        res.json({ message: 'OTP sent to your email' });
    } catch (err) {
        console.error('Admin Forgot Pwd Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

        const admin = await User.findOne({ 
            email, 
            role: 'admin',
            resetOtp: otp,
            resetOtpExpiry: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ message: 'All fields required' });

        const admin = await User.findOne({ 
            email, 
            role: 'admin',
            resetOtp: otp,
            resetOtpExpiry: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        admin.password = newPassword;
        admin.resetOtp = undefined;
        admin.resetOtpExpiry = undefined;
        await admin.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/orders
router.get('/orders', adminProtect, async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/orders/:id
router.put('/orders/:id', adminProtect, async (req, res) => {
    try {
        const { status, cancelReason } = req.body;
        const update = { status };
        if (cancelReason !== undefined) update.cancelReason = cancelReason;

        const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });

        // Automatic Blocking Logic
        if (status === 'Not Received') {
            const userId = order.user;
            const notReceivedCount = await Order.countDocuments({ user: userId, status: 'Not Received' });

            if (notReceivedCount >= 3) {
                await User.findByIdAndUpdate(userId, { isBlocked: true });
            }
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/users
router.get('/users', adminProtect, async (req, res) => {
    try {
        // Fetch users with their "Not Received" order count
        const enhancedUsers = await User.aggregate([
            { $sort: { createdAt: 1 } }, // Sort oldest first to assign regNumbers
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'userOrders',
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    isBlocked: 1,
                    createdAt: 1,
                    image: 1,
                    notReceivedCount: {
                        $size: {
                            $filter: {
                                input: '$userOrders',
                                as: 'order',
                                cond: { $eq: ['$$order.status', 'Not Received'] }
                            }
                        }
                    }
                }
            }
        ]);

        // Assign registration numbers (1 = first registered user)
        const finalUsers = enhancedUsers.map((u, index) => ({
            ...u,
            regNumber: index + 1
        }));

        // Sort newest first for the admin panel display
        finalUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(finalUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/users/:id/block
router.put('/users/:id/block', adminProtect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/foods
router.get('/foods', adminProtect, async (req, res) => {
    try {
        const foods = await FoodItem.find().populate('restaurant', 'name').sort({ createdAt: -1 });
        res.json(foods);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/reviews
router.get('/reviews', adminProtect, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name email')
            .populate('restaurant', 'name')
            .populate('foodItem', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/foods
router.post('/foods', adminProtect, async (req, res) => {
    try {
        const food = await FoodItem.create(req.body);
        res.status(201).json(food);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/foods/:id
router.put('/foods/:id', adminProtect, async (req, res) => {
    try {
        const food = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!food) return res.status(404).json({ message: 'Food item not found' });
        console.log(`Food updated: ${food.name}`);
        res.json(food);
    } catch (err) {
        console.error('Food Update Error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// DELETE /api/admin/foods/:id
router.delete('/foods/:id', adminProtect, async (req, res) => {
    try {
        await FoodItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/restaurants
router.post('/restaurants', adminProtect, async (req, res) => {
    try {
        const r = await Restaurant.create(req.body);
        res.status(201).json(r);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/restaurants/:id  - update any field (e.g. isOpen)
router.put('/restaurants/:id', adminProtect, async (req, res) => {
    try {
        const r = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!r) return res.status(404).json({ message: 'Restaurant not found' });
        console.log(`Restaurant updated: ${r.name}`);
        res.json(r);
    } catch (err) {
        console.error('Restaurant Update Error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// GET /api/admin/stats
router.get('/stats', adminProtect, async (req, res) => {
    console.log('--- GET /api/admin/stats requested ---');
    try {
        const [totalOrders, totalUsers, totalFoods, totalCategories, totalRevenue, monthlyRevenue, monthlyUsers] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),
            FoodItem.countDocuments(),
            Category.countDocuments(),
            Order.aggregate([
                { $match: { status: 'Delivered' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            // Monthly revenue from delivered orders
            Order.aggregate([
                { $match: { status: 'Delivered' } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        revenue: { $sum: '$total' }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } }
            ]),
            // Monthly new user signups
            User.aggregate([
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } }
            ])
        ]);
        res.json({
            totalOrders,
            totalUsers,
            totalFoods,
            totalCategories,
            totalRevenue: totalRevenue[0]?.total || 0,
            monthlyRevenue,
            monthlyUsers,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------------
// Image Upload Route (Cloudinary)
// ---------------------------------------------
router.post('/upload', adminProtect, upload.single('image'), (req, res) => {
    if (!req.file) {
        console.warn('No file provided in upload request');
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Cloudinary returns the secure_url in req.file.path when using multer-storage-cloudinary
    const imageUrl = req.file.path;
    console.log(`File uploaded to Cloudinary: ${imageUrl}`);
    res.json({ url: imageUrl });
});

// DELETE /api/admin/restaurants/:id
router.delete('/restaurants/:id', adminProtect, async (req, res) => {
    try {
        await Restaurant.findByIdAndDelete(req.params.id);
        // Also delete foods belonging to this restaurant
        await FoodItem.deleteMany({ restaurant: req.params.id });
        res.json({ message: 'Restaurant and its food items deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Category Management

// POST /api/admin/categories
router.post('/categories', adminProtect, async (req, res) => {
    try {
        const { name, image } = req.body;
        const category = await Category.create({ name, image });
        res.status(201).json(category);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Category already exists' });
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', adminProtect, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', adminProtect, async (req, res) => {
    try {
        const { name, image } = req.body;
        const category = await Category.findByIdAndUpdate(req.params.id, { name, image }, { new: true });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Category name already exists' });
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', adminProtect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const { restaurant: restaurantId, foodItem: foodItemId } = review;

        // 1. Delete the review
        await Review.findByIdAndDelete(req.params.id);

        // 2. Recalculate FoodItem Rating
        const food = await FoodItem.findById(foodItemId);
        if (food) {
            // Remove from food item's internal reviews array
            food.reviews = food.reviews.filter(r => r.user.toString() !== review.user.toString() || r.comment !== review.comment);

            if (food.reviews.length > 0) {
                const foodAvg = food.reviews.reduce((acc, curr) => acc + curr.rating, 0) / food.reviews.length;
                food.rating = Number(foodAvg.toFixed(1));
            } else {
                food.rating = 0;
            }
            await food.save();
        }

        // 3. Recalculate Restaurant Rating (Overall)
        const remainingReviews = await Review.find({ restaurant: restaurantId });
        const restaurant = await Restaurant.findById(restaurantId);
        if (restaurant) {
            if (remainingReviews.length > 0) {
                const restAvg = remainingReviews.reduce((acc, curr) => acc + curr.rating, 0) / remainingReviews.length;
                restaurant.rating = Number(restAvg.toFixed(1));
                restaurant.numReviews = remainingReviews.length;
            } else {
                restaurant.rating = 0;
                restaurant.numReviews = 0;
            }
            await restaurant.save();
        }

        res.json({ message: 'Review deleted and ratings updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
