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
    if (!email || !password)
        return res.status(400).json({ message: 'Email and password required' });

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD)
        return res.status(401).json({ message: 'Invalid admin credentials' });

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
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

        // NEW: Automatic Blocking Logic
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
        const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();

        // Enhance each user with their "Not Received" order count
        const enhancedUsers = await Promise.all(users.map(async (u) => {
            const notReceivedCount = await Order.countDocuments({ user: u._id, status: 'Not Received' });
            return { ...u, notReceivedCount };
        }));

        res.json(enhancedUsers);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/users/:id/block
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
        res.json(food);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
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
        res.json(r);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/stats
router.get('/stats', adminProtect, async (req, res) => {
    try {
        const [totalOrders, totalUsers, totalFoods, totalCategories, totalRevenue] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),
            FoodItem.countDocuments(),
            Category.countDocuments(),
            Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
        ]);
        res.json({
            totalOrders,
            totalUsers,
            totalFoods,
            totalCategories,
            totalRevenue: totalRevenue[0]?.total || 0,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// Image Upload Route
// ─────────────────────────────────────────────
router.post('/upload', adminProtect, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ url: filePath });
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
