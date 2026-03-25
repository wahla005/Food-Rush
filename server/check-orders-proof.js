const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const orders = await Order.find({ paymentProof: { $exists: true, $ne: null } });
        console.log('Sample Order Payment Proofs:');
        orders.forEach(o => {
            console.log(`- Order ${o._id}: ${o.paymentProof}`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
