const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const users = await User.find({ image: { $exists: true, $ne: null } });
        console.log('Sample User Images:');
        users.forEach(u => {
            console.log(`- ${u.name}: ${u.image}`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
