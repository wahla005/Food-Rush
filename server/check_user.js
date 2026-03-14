const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/foodapp');
        console.log('Connected to foodapp');

        const db = mongoose.connection.db;
        const col = db.collection('users');

        const user = await col.findOne({ email: 'fwahla970@gmail.com' });
        if (user) {
            console.log('User found:', user.email);
            console.log('isVerified:', user.isVerified);

            if (!user.isVerified) {
                await col.updateOne({ _id: user._id }, { $set: { isVerified: true } });
                console.log('User has been manually verified.');
            }
        } else {
            console.log('User NOT found in foodapp database.');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
