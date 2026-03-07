const express = require('express');
const router = express.Router();
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// BASE FEE
const BASE_DELIVERY_FEE = 59;

// POST /api/orders  — place order
router.post('/', protect, async (req, res) => {
    try {
        const { restaurantName, items: incomingItems, deliveryAddress, paymentMethod, restaurant } = req.body;

        // NEW: Check if user is blocked
        const user = await req.user.constructor.findById(req.user._id);
        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account is blocked from placing orders due to multiple non-received deliveries.' });
        }

        // 1. Check first-order status for delivery fee validation
        const pastOrders = await Order.countDocuments({ user: req.user._id });
        const isFirstOrder = pastOrders === 0;
        const expectedDeliveryFee = isFirstOrder ? 0 : BASE_DELIVERY_FEE;

        // 2. Validate items and recalculate subtotal
        let validatedSubtotal = 0;
        const validatedItems = [];

        for (const item of incomingItems) {
            const food = await FoodItem.findById(item.food);
            if (!food) return res.status(400).json({ message: `Food item ${item.name} not found` });

            // Admin discount
            let currentPrice = food.price;
            if (food.discount > 0) {
                currentPrice = Math.round(food.price * (1 - food.discount / 100));
            }

            // EXTRA Rule 2: Pizza promo (extra 25% off Pizza > Rs. 1500)
            if (food.category && food.category.toLowerCase() === 'pizza' && food.price > 1500) {
                currentPrice = Math.round(currentPrice * 0.75);
            }

            validatedSubtotal += currentPrice * item.quantity;
            validatedItems.push({
                food: food._id,
                name: food.name,
                image: food.image,
                price: currentPrice,
                quantity: item.quantity
            });
        }

        const validatedTotal = validatedSubtotal + expectedDeliveryFee;

        const order = await Order.create({
            user: req.user._id,
            restaurant,
            restaurantName,
            items: validatedItems,
            subtotal: validatedSubtotal,
            deliveryFee: expectedDeliveryFee,
            total: validatedTotal,
            deliveryAddress,
            paymentMethod: paymentMethod || 'COD',
        });

        res.status(201).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/orders/my  — current user orders
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/orders/:id/status  (admin)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
