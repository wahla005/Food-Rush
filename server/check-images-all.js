const mongoose = require('mongoose');
require('dotenv').config();
const FoodItem = require('./models/FoodItem');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://FoodRush:foodrush@foodrush.xu4x48z.mongodb.net/FoodRush?retryWrites=true&w=majority')
    .then(async () => {
        const foods = await FoodItem.find({});
        console.log('Sample Food Images:');
        foods.forEach(f => {
            console.log(`- ${f.name}: ${f.image}`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
