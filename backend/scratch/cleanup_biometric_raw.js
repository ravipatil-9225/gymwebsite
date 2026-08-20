require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Use raw collection to unset biometricCardId from ALL documents that have it as null
        const col = mongoose.connection.collection('users');
        
        // Count docs with biometricCardId explicitly stored as null
        const withNull = await col.countDocuments({ biometricCardId: null });
        console.log(`Docs with biometricCardId=null in raw MongoDB: ${withNull}`);
        
        // Unset it at raw MongoDB level (bypass Mongoose)
        const result = await col.updateMany(
            { biometricCardId: null },
            { $unset: { biometricCardId: "" } }
        );
        console.log(`Updated: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
        
        // Verify
        const afterNull = await col.countDocuments({ biometricCardId: null });
        const afterExists = await col.countDocuments({ biometricCardId: { $exists: true } });
        console.log(`After: biometricCardId=null count: ${afterNull}`);
        console.log(`After: biometricCardId field exists count: ${afterExists}`);

        // Also delete leftover test users
        const deleted = await col.deleteMany({ email: /^testone_|^testtwo_/ });
        console.log(`Deleted ${deleted.deletedCount} leftover test users`);

        // Print current indexes
        const indexes = await col.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique, sparse: i.sparse })), null, 2));
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
    }
}

cleanup();
