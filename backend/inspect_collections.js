require('dotenv').config();
const mongoose = require('mongoose');

async function go() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to:', process.env.MONGO_URI);
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('\n--- Collections in current db ---');
        for (let c of collections) {
            const count = await db.collection(c.name).countDocuments();
            console.log(`  - ${c.name}: ${count} docs`);
        }
        
        const admin = mongoose.connection.client.db().admin();
        const dbs = await admin.listDatabases();
        console.log('\n--- All databases on this MongoDB server ---');
        dbs.databases.forEach(d => console.log(`  - ${d.name} (${d.sizeOnDisk} bytes)`));
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
go();
