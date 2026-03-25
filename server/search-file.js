const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const results = await mongoose.connection.db.collection(col.name).find({
                $or: [
                    { image: { $regex: '1773217228725' } },
                    { paymentProof: { $regex: '1773217228725' } }
                ]
            }).toArray();
            if (results.length > 0) {
                console.log(`FOUND in ${col.name}:`, JSON.stringify(results[0]));
            }
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
