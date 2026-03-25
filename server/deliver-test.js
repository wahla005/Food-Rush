require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function deliverAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await Order.updateMany(
            { status: { $ne: 'Delivered' } },
            { status: 'Delivered' }
        );
        console.log(`Marked ${result.modifiedCount} orders as Delivered`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deliverAll();
