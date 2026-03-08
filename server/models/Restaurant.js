const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    cuisine: [String],
    rating: { type: Number, default: 0 },
    deliveryTime: { type: String, default: '30-45 min' },
    minOrder: { type: Number, default: 200 },
    deliveryFee: { type: Number, default: 50 },
    isOpen: { type: Boolean, default: true },
    address: String,
    description: String,
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
