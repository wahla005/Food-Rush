const mongoose = require('mongoose');
const fs = require('fs');

async function findUsers() {
    let output = '';
    try {
        const client = await mongoose.connect('mongodb://localhost:27017/admin');
        const admin = client.connection.db.admin();
        const dbs = await admin.listDatabases();
        await mongoose.disconnect();

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'config', 'local'].includes(dbName)) continue;

            output += `\n--- DB: ${dbName} ---\n`;
            const conn = await mongoose.connect('mongodb://localhost:27017/' + dbName);
            const collections = await conn.connection.db.listCollections().toArray();

            for (const col of collections) {
                const count = await conn.connection.db.collection(col.name).countDocuments();
                output += `  Collection: ${col.name} (Count: ${count})\n`;

                if (col.name === 'users' && count > 0) {
                    const users = await conn.connection.db.collection(col.name).find().toArray();
                    users.forEach(u => {
                        output += `    - User: ${u.email} | Name: ${u.name} | Verified: ${u.isVerified}\n`;
                    });
                }
            }
            await mongoose.disconnect();
        }
        fs.writeFileSync('db_audit.txt', output);
        console.log('Audit complete. See db_audit.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUsers();
