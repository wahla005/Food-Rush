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
        enum: ['Payment Pending', 'Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Not Received'],
        default: 'Pending',
    },
    deliveryAddress: {
        fullName: String,
        phone: String,
        address: String,
        city: String,
    },
    paymentMethod: { type: String, default: 'COD' },
    // Digital wallet payment proof
    transactionRef: { type: String, default: null },
    mobilePayNumber: { type: String, default: null },
    paymentProof: { type: String, default: null }, // URL to uploaded screenshot
    cancelReason: { type: String, default: null },  // Shown to user when order is cancelled
    estimatedDelivery: { type: String, default: '30-45 min' },
    dailyOrderNumber: { type: Number },
}, { timestamps: true });

orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ total: 1 });

module.exports = mongoose.model('Order', orderSchema);
