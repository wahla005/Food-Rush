const express = require('express');
const router = express.Router();
const FoodItem = require('../models/FoodItem');
const { protect } = require('../middleware/auth');

// GET /api/foods  — supports ?category=&restaurant=&search=
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.restaurant) filter.restaurant = req.query.restaurant;
        if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
        if (req.query.isVeg) filter.isVeg = req.query.isVeg === 'true';
        if (req.query.isTopRated) filter.isTopRated = req.query.isTopRated === 'true';

        let query = FoodItem.find(filter).populate('restaurant', 'name deliveryTime');
        if (req.query.sort === 'price_asc') query = query.sort({ price: 1 });
        else if (req.query.sort === 'price_desc') query = query.sort({ price: -1 });
        else if (req.query.sort === 'rating') query = query.sort({ rating: -1 });

        const foods = await query;
        res.json(foods);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/foods/:id
router.get('/:id', async (req, res) => {
    try {
        const food = await FoodItem.findById(req.params.id).populate('restaurant', 'name deliveryTime deliveryFee');
        if (!food) return res.status(404).json({ message: 'Food not found' });
        res.json(food);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/foods/:id/review  (protected)
router.post('/:id/review', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const food = await FoodItem.findById(req.params.id);
        if (!food) return res.status(404).json({ message: 'Food not found' });
        food.reviews.push({ user: req.user._id, userName: req.user.name, rating, comment });
        const avg = food.reviews.reduce((a, b) => a + b.rating, 0) / food.reviews.length;
        food.rating = Math.round(avg * 10) / 10;
        await food.save();
        res.json({ message: 'Review added', food });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/foods  (admin)
router.post('/', protect, async (req, res) => {
    try {
        const food = await FoodItem.create(req.body);
        res.status(201).json(food);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/foods/:id  (admin)
router.put('/:id', protect, async (req, res) => {
    try {
        const food = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(food);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/foods/:id  (admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        await FoodItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Food item deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
