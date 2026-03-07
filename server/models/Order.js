const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
    name: String,
    image: String,
    price: Number,
    quantity: { type: Number, default: 1 },
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    restaurantName: String,
    items: [orderItemSchema],
    subtotal: Number,
    deliveryFee: { type: Number, default: 50 },
    total: Number,
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Not Received'],
        default: 'Pending',
    },
    deliveryAddress: {
        fullName: String,
        phone: String,
        address: String,
        city: String,
    },
    paymentMethod: { type: String, default: 'COD' },
    estimatedDelivery: { type: String, default: '30-45 min' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
