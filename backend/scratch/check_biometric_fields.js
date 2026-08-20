require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const usersWithNull = await User.find({ biometricCardId: null });
        console.log(`Found ${usersWithNull.length} users with biometricCardId = null`);
        for (const u of usersWithNull) {
            console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, biometricCardId: ${u.biometricCardId}`);
        }

        const usersWithUndefined = await User.find({ biometricCardId: { $exists: false } });
        console.log(`Found ${usersWithUndefined.length} users where biometricCardId field does not exist`);

        const usersWithVal = await User.find({ biometricCardId: { $ne: null, $exists: true } });
        console.log(`Found ${usersWithVal.length} users with a non-null biometricCardId`);
        for (const u of usersWithVal) {
            console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, biometricCardId: ${u.biometricCardId}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
