const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./models/Category');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const cats = await Category.find({});
        console.log('Sample Category Images:');
        cats.forEach(c => {
            console.log(`- ${c.name}: ${c.image}`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
