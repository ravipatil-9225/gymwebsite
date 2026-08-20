require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const col = mongoose.connection.collection('users');

        // Step 1: Show what's in the raw docs
        const sample = await col.findOne({}, { projection: { name: 1, email: 1, biometricCardId: 1 } });
        console.log('Sample doc raw:', JSON.stringify(sample));

        // Step 2: Drop the problematic biometricCardId index
        try {
            await col.dropIndex('biometricCardId_1');
            console.log('Dropped biometricCardId_1 index');
        } catch (e) {
            console.log('Index drop error (may not exist):', e.message);
        }

        // Step 3: Use $unset to remove field from docs that have it as null
        const result = await col.updateMany(
            { biometricCardId: { $type: 10 } },  // type 10 = Null
            { $unset: { biometricCardId: 1 } }
        );
        console.log(`Unset null biometricCardId: matched=${result.matchedCount}, modified=${result.modifiedCount}`);

        // Step 4: Verify
        const nullCount = await col.countDocuments({ biometricCardId: { $type: 10 } });
        const existsCount = await col.countDocuments({ biometricCardId: { $exists: true } });
        console.log(`After cleanup: null type count=${nullCount}, field exists count=${existsCount}`);

        // Step 5: Recreate the sparse unique index
        await col.createIndex(
            { biometricCardId: 1 },
            { unique: true, sparse: true, name: 'biometricCardId_1' }
        );
        console.log('Recreated biometricCardId_1 sparse unique index');

        // Step 6: Final index list
        const indexes = await col.indexes();
        console.log('Final Indexes:', JSON.stringify(indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique, sparse: i.sparse })), null, 2));

    } catch (err) {
        console.error('Fix failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
    }
}

fixIndex();
