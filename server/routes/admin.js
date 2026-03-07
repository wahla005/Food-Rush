const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const FoodItem = require('../models/FoodItem');
const Restaurant = require('../models/Restaurant');
const { adminProtect, ADMIN_JWT_SECRET } = require('../middleware/adminAuth');

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
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/users
router.get('/users', adminProtect, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
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
        const [totalOrders, totalUsers, totalFoods, totalRevenue] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),
            FoodItem.countDocuments(),
            Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
        ]);
        res.json({
            totalOrders,
            totalUsers,
            totalFoods,
            totalRevenue: totalRevenue[0]?.total || 0,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
