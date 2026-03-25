const mongoose = require('mongoose');

// Try local MongoDB first
mongoose.connect('mongodb://127.0.0.1:27017/foodapp')
    .then(async () => {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in LOCAL database:');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name} (${count})`);
            
            const results = await mongoose.connection.db.collection(col.name).find({
                $or: [
                    { image: { $regex: '1773' } },
                    { paymentProof: { $regex: '1773' } }
                ]
            }).toArray();
            
            if (results.length > 0) {
                console.log(`FOUND in ${col.name}:`, JSON.stringify(results[0]));
            }
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Local MongoDB connection failed:', err.message);
        process.exit(1);
    });
