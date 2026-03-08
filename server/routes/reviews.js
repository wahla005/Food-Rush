const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
const { protect } = require('../middleware/auth');

const Order = require('../models/Order');

// POST /api/reviews - submit a new review for a specific product
router.post('/', protect, async (req, res) => {
    try {
        const { restaurant, order: orderId, foodItem: foodItemId, rating, comment } = req.body;

        // 1. Verify order exists, belongs to user, and is delivered
        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.status !== 'Delivered') {
            return res.status(400).json({ message: 'Only delivered orders can be reviewed' });
        }

        // 2. Verify foodItem is part of this order
        const itemInOrder = order.items.find(i => i.food.toString() === foodItemId);
        if (!itemInOrder) {
            return res.status(400).json({ message: 'Product not found in this order' });
        }

        // 3. Check if a review already exists for this item in this order
        const existingReview = await Review.findOne({ order: orderId, foodItem: foodItemId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const review = await Review.create({
            user: req.user._id,
            restaurant,
            order: orderId,
            foodItem: foodItemId,
            rating: Number(rating),
            comment
        });

        // 4. Update Food Item ratings (specifically for this item)
        const food = await FoodItem.findById(foodItemId);
        if (food) {
            // Add sub-review to food item
            food.reviews.push({
                user: req.user._id,
                userName: req.user.name,
                rating: Number(rating),
                comment
            });

            // Recalculate food avg rating
            const foodAvg = food.reviews.reduce((acc, curr) => acc + curr.rating, 0) / food.reviews.length;
            food.rating = Number(foodAvg.toFixed(1));
            await food.save();
        }

        // 5. Recalculate average rating for the restaurant
        const reviews = await Review.find({ restaurant });
        const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

        await Restaurant.findByIdAndUpdate(restaurant, { rating: Number(avgRating.toFixed(1)) });

        res.status(201).json(review);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/reviews/restaurant/:restaurantId - get reviews for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const reviews = await Review.find({ restaurant: req.params.restaurantId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
