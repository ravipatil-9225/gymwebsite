/**
 * inspect_memberships.js
 * Checks the actual state of all memberships in the live DB.
 * Run: node inspect_memberships.js
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const Membership = require('./models/Membership');
const User       = require('./models/User');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected\n');

    const now = new Date();
    const all = await Membership.find({}).populate('userId').sort({ endDate: 1 });

    console.log(`Total memberships in DB: ${all.length}\n`);

    const buckets = {
        expiredLong  : [],  // expired > 3 days ago
        expiredRecent: [],  // expired 0-3 days ago  → send expired_template
        expiry1      : [],  // expires tomorrow
        expiry2      : [],  // expires in 2 days
        expiry3      : [],  // expires in 3 days      → send reminder
        expiry7      : [],  // expires in 7 days      → send reminder
        active       : [],  // active, > 7 days left
        cancelled    : []
    };

    for (const m of all) {
        const endDate  = new Date(m.endDate);
        const msLeft   = endDate - now;
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        const entry    = {
            name    : m.userName,
            plan    : m.packageName,
            endDate : endDate.toLocaleDateString('en-IN'),
            daysLeft,
            phone   : m.userId?.phone || '—',
            status  : m.status
        };

        if (m.status === 'cancelled')       buckets.cancelled.push(entry);
        else if (daysLeft < -3)             buckets.expiredLong.push(entry);
        else if (daysLeft <= 0)             buckets.expiredRecent.push(entry);
        else if (daysLeft === 1)            buckets.expiry1.push(entry);
        else if (daysLeft === 2)            buckets.expiry2.push(entry);
        else if (daysLeft === 3)            buckets.expiry3.push(entry);
        else if (daysLeft <= 7)             buckets.expiry7.push(entry);
        else                                buckets.active.push(entry);
    }

    const print = (label, list) => {
        console.log(`\n${label} (${list.length}):`);
        if (list.length === 0) { console.log('  — none'); return; }
        list.forEach(e =>
            console.log(`  ${e.name.padEnd(25)} | ${e.plan.padEnd(25)} | Ends: ${e.endDate} | Days: ${String(e.daysLeft).padStart(4)} | Phone: ${e.phone}`)
        );
    };

    print('🚫 EXPIRED > 3 DAYS AGO (cron already handled or missed)', buckets.expiredLong);
    print('🔴 EXPIRED RECENTLY (0-3 days ago) → WILL SEND expired alert', buckets.expiredRecent);
    print('🚨 EXPIRING TOMORROW (1 day)', buckets.expiry1);
    print('⚠️  EXPIRING IN 2 DAYS', buckets.expiry2);
    print('⏳ EXPIRING IN 3 DAYS → WILL SEND reminder', buckets.expiry3);
    print('📅 EXPIRING IN 4-7 DAYS → WILL SEND reminder at 7', buckets.expiry7);
    print('✅ ACTIVE (> 7 days left)', buckets.active);
    print('❌ CANCELLED', buckets.cancelled);

    await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
