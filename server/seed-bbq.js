const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const FoodItem = require('./models/FoodItem');

mongoose.connect('mongodb://127.0.0.1:27017/foodapp')
    .then(async () => {
        let res = await Restaurant.findOne();
        if (!res) {
            res = await Restaurant.create({
                name: 'Test Grill',
                image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
                cuisine: 'BBQ',
                rating: 4.5,
                deliveryTime: '20-30 min',
                deliveryFee: 59,
                address: '123 Grill St'
            });
        }

        const bbqData = [
            {
                restaurant: res._id,
                name: 'Small BBQ Platter',
                description: 'A small platter of BBQ items',
                image: 'https://images.unsplash.com/photo-1529193591184-b1d58b34ecdf',
                price: 800,
                category: 'BBQ',
                inStock: true
            },
            {
                restaurant: res._id,
                name: 'Mega BBQ Feast',
                description: 'A huge platter for the whole family',
                image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
                price: 2500,
                category: 'BBQ',
                inStock: true
            },
            {
                restaurant: res._id,
                name: 'Pizza Margherita',
                description: 'Classic pizza',
                image: 'https://images.unsplash.com/photo-1574129330623-df46bfc06c11',
                price: 1200,
                category: 'Pizza',
                inStock: true
            }
        ];

        await FoodItem.insertMany(bbqData);
        console.log('Seeded BBQ and Pizza items successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
