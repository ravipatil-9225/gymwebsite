require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const before = await User.countDocuments({ biometricCardId: null });
        console.log(`Number of users with biometricCardId = null before migration: ${before}`);

        // Perform the migration
        const result = await User.updateMany(
            { biometricCardId: null },
            { $unset: { biometricCardId: "" } }
        );
        console.log(`Migration result: matched ${result.matchedCount}, modified ${result.modifiedCount}`);

        const after = await User.countDocuments({ biometricCardId: null });
        console.log(`Number of users with biometricCardId = null after migration: ${after}`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
