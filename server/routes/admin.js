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
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
// Multer Configuration for Gallery Uploads
// ─────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ─────────────────────────────────────────────
// Hardcoded admin credentials
// ─────────────────────────────────────────────
const ADMIN_EMAIL = 'fwahla970@gmail.com';
const ADMIN_PASSWORD = 'faizan123';

// POST /api/admin/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`🔑 Admin login attempt for: ${email}`);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        console.warn(`❌ Admin login failed for: ${email}`);
        return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    console.log(`✅ Admin logged in: ${email}`);
    const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { email: ADMIN_EMAIL, name: 'Admin' } });
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
        console.log(`✅ Food updated: ${food.name}`);
        res.json(food);
    } catch (err) {
        console.error('❌ Food Update Error:', err);
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

// PUT /api/admin/restaurants/:id  — update any field (e.g. isOpen)
router.put('/restaurants/:id', adminProtect, async (req, res) => {
    try {
        const r = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!r) return res.status(404).json({ message: 'Restaurant not found' });
        console.log(`✅ Restaurant updated: ${r.name}`);
        res.json(r);
    } catch (err) {
        console.error('❌ Restaurant Update Error:', err);
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

// ─────────────────────────────────────────────
// Image Upload Route
// ─────────────────────────────────────────────
router.post('/upload', adminProtect, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('❌ Upload Error:', err);
            return res.status(500).json({ message: 'Upload failed: ' + err.message });
        }
        if (!req.file) {
            console.warn('⚠️ No file provided in upload request');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const filePath = `/uploads/${req.file.filename}`;
        console.log(`✅ File uploaded successfully: ${filePath}`);
        res.json({ url: filePath });
    });
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
