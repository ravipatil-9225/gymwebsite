/**
 * One-time cleanup script: removes empty-string ("") biometricCardId values
 * from the users collection so the sparse unique index works correctly.
 *
 * Run with: node scratch/fix_empty_biometric_ids.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB:', process.env.MONGO_URI);

    const col = mongoose.connection.collection('users');

    // Count affected docs
    const emptyCount = await col.countDocuments({ biometricCardId: '' });
    console.log(`Found ${emptyCount} users with biometricCardId = "" (empty string)`);

    if (emptyCount > 0) {
        // Unset the field so the sparse index ignores these docs
        const result = await col.updateMany(
            { biometricCardId: '' },
            { $unset: { biometricCardId: '' } }
        );
        console.log(`Fixed: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
    }

    // Also unset explicit null values (safety net)
    const nullCount = await col.countDocuments({ biometricCardId: null });
    console.log(`Found ${nullCount} users with biometricCardId = null`);
    if (nullCount > 0) {
        const r2 = await col.updateMany(
            { biometricCardId: null },
            { $unset: { biometricCardId: '' } }
        );
        console.log(`Fixed null: matched=${r2.matchedCount}, modified=${r2.modifiedCount}`);
    }

    console.log('Done. All empty/null biometricCardId values have been removed.');
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
