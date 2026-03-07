const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
}, { timestamps: true });

const foodItemSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    description: String,
    image: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    isVeg: { type: Boolean, default: false },
    rating: { type: Number, default: 4.0 },
    reviews: [reviewSchema],
    inStock: { type: Boolean, default: true },
    ingredients: [String],
    discount: { type: Number, default: 0, min: 0, max: 100 },  // percentage off (0 = no discount)
}, { timestamps: true });

module.exports = mongoose.model('FoodItem', foodItemSchema);
