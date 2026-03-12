const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');

// GET /api/restaurants
router.get('/', async (req, res) => {
    try {
        let filter = {};
        if (req.query.isPopular === 'true') filter.isPopular = true;
        const restaurants = await Restaurant.find(filter);
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        const foods = await FoodItem.find({ restaurant: req.params.id });
        res.json({ restaurant, foods });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
