const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const admins = await User.find({ role: 'admin' });
        console.log(`Found ${admins.length} admins.`);
        
        for (const admin of admins) {
            console.log(`- Email: ${admin.email}, ID: ${admin._id}, isVerified: ${admin.isVerified}`);
            
            // Test against 'faizan123' (hardcoded default)
            const isDefault = await bcrypt.compare('faizan123', admin.password);
            console.log(`  Matches 'faizan123': ${isDefault}`);
        }
        
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
