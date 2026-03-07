const mongoose = require('mongoose');
const path = require('path');
const Food = require('./models/FoodItem');

mongoose.connect('mongodb://127.0.0.1:27017/foodapp')
    .then(async () => {
        const foods = await Food.find({ category: /bbq/i });
        console.log('BBQ Items Found:', foods.length);
        foods.forEach(f => {
            console.log(`- ${f.name}: Rs. ${f.price} (ID: ${f._id})`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
