const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createVerifiedUser = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food_delivery');

        const email = 'verified@test.com';
        const hashedPassword = await bcrypt.hash('Password123!', 10);

        // Delete if exists
        await User.deleteOne({ email });

        await User.create({
            name: 'Verified Tester',
            email,
            password: hashedPassword,
            isVerified: true
        });

        console.log('Verified user created: verified@test.com / Password123!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createVerifiedUser();
