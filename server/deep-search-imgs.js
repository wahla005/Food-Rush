const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in database:');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name} (${count})`);
            
            // Search for "1773" (which is a prefix for many files in uploads)
            const sample = await mongoose.connection.db.collection(col.name).find({
                $or: [
                    { image: { $regex: '1773' } },
                    { image: { $regex: 'uploads' } },
                    { paymentProof: { $regex: 'uploads' } },
                    { proof: { $regex: 'uploads' } }
                ]
            }).toArray();
            
            if (sample.length > 0) {
                console.log(`  Found ${sample.length} matches in ${col.name}:`);
                sample.slice(0, 3).forEach(s => {
                    console.log(`    - Match: ${JSON.stringify(s)}`);
                });
            }
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
