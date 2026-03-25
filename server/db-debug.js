const mongoose = require('mongoose');
require('dotenv').config();
const FoodItem = require('./models/FoodItem');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const foodCount = await FoodItem.countDocuments();
        const restoCount = await Restaurant.countDocuments();
        const userCount = await User.countDocuments();
        console.log(`Counts - Foods: ${foodCount}, Restaurants: ${restoCount}, Users: ${userCount}`);
        
        if (foodCount > 0) {
            const sample = await FoodItem.findOne();
            console.log('Sample Food:', JSON.stringify(sample, null, 2));
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
