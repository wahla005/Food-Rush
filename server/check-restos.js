const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const restos = await Restaurant.find({});
        console.log('Sample Restaurant Images:');
        restos.forEach(r => {
            console.log(`- ${r.name}: ${r.image}`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
