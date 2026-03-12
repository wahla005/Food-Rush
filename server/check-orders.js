const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const check = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const orders = await Order.find().limit(5);
    console.log(JSON.stringify(orders, null, 2));
    process.exit(0);
};

check();
