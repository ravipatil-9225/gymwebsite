/**
 * Restore Admin Account Script — Tara Fitness Centre
 * Run: node restoreAdmin.js <password>
 *
 * This script re-creates the admin account in MongoDB if it doesn't exist.
 * It will NOT overwrite an existing account with the same email.
 *
 * Usage:
 *   node restoreAdmin.js yourPasswordHere
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym-website';

// ── Admin account details ──────────────────────────────────────────────────
const ADMIN_EMAIL    = process.env.OWNER_EMAIL || 'tarafitness365@gmail.com';
const ADMIN_NAME     = 'Tara Fitness Admin';
const ADMIN_PHONE    = '9999999999';
const ADMIN_DOB      = '1990-01-01';
const ADMIN_ROLE     = 'admin';

// Password from CLI arg
const ADMIN_PASSWORD = process.argv[2];

if (!ADMIN_PASSWORD) {
    console.error('\n❌  Please provide the admin password as a command-line argument:');
    console.error('    node restoreAdmin.js <yourPassword>\n');
    process.exit(1);
}

async function main() {
    console.log('\n=== Tara Fitness Centre — Admin Account Restore ===\n');

    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB:', MONGO_URI, '\n');

    // Dynamically load the User model AFTER connecting so hooks work correctly
    const User = require('./models/User');

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
        console.log(`✅  Admin account already exists for: ${ADMIN_EMAIL}`);
        console.log('    No changes were made. If you need to reset the password, use the Forgot Password flow.');
    } else {
        // Hash password manually (same salt rounds as the User model)
        const salt   = await bcrypt.genSalt(8);
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);

        await User.collection.insertOne({
            name:             ADMIN_NAME,
            email:            ADMIN_EMAIL.toLowerCase(),
            password:         hashed,
            role:             ADMIN_ROLE,
            phone:            ADMIN_PHONE,
            dob:              ADMIN_DOB,
            batchTime:        'Not Assigned',
            goal:             '',
            profileImage:     { url: '', public_id: '' },
            allowPendingPayment: true,
            pendingDaysLimit: 30,
            lastLogin:        null,
            registrationDate: new Date(),
            createdAt:        new Date(),
            updatedAt:        new Date(),
        });

        console.log(`🌱  Admin account RESTORED successfully!`);
        console.log(`    Email   : ${ADMIN_EMAIL}`);
        console.log(`    Role    : ${ADMIN_ROLE}`);
        console.log(`    Password: (the one you provided)\n`);
        console.log('    ✅  You can now log in at the admin panel.\n');
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('❌  Error:', err.message);
    process.exit(1);
});
