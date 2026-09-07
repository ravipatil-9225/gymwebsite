/**
 * realtime_whatsapp_blast.js
 *
 * Connects to the LIVE database and sends WhatsApp messages to every user
 * based on their ACTUAL current membership/payment state.
 *
 * CONDITIONS HANDLED:
 *  ① Membership expiring in exactly 7 days  → membership_expiry_reminder_template
 *  ② Membership expiring in exactly 3 days  → membership_expiry_reminder_template
 *  ③ Membership expiring in exactly 1 day   → membership_expiry_reminder_template
 *  ④ Membership expired today or yesterday  → membership_expired_template
 *  ⑤ Pay-later payment is overdue           → membership_overdue_reminder_template
 *  ⑥ Cash-on-bench payment still pending    → cash_payment_request_template
 *
 * SAFE: Only users with role='user' and a valid phone number are messaged.
 * LOGS: Every attempt (success or fail) is printed to console with name + phone.
 *
 * Usage: node realtime_whatsapp_blast.js
 * Optional: node realtime_whatsapp_blast.js --dry-run   (shows what WOULD be sent, no actual API calls)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const DRY_RUN = process.argv.includes('--dry-run');

// ── Models ───────────────────────────────────────────────────────────────────
const User       = require('./models/User');
const Membership = require('./models/Membership');
const Payment    = require('./models/Payment');

// ── WhatsApp API (direct calls — no event system needed for a manual blast) ──
const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';
const TEMPLATE_NOT_READY_CODES = [132001, 132000, 132005];

async function callMetaAPI(to, templateName, components) {
    if (DRY_RUN) {
        console.log(`  [DRY-RUN] Would send "${templateName}" to ${to}`);
        return { success: true, dryRun: true };
    }

    const token   = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    let num = String(to).replace(/\D/g, '');
    if (num.startsWith('0') && num.length === 11) num = num.substring(1);
    if (num.length === 10) num = '91' + num;
    if (num.length < 11) {
        console.warn(`    ⚠️  Invalid phone "${to}" → skipping`);
        return null;
    }

    const res  = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body   : JSON.stringify({
            messaging_product: 'whatsapp',
            to: num, type: 'template',
            template: { name: templateName, language: { code: 'en' }, components }
        })
    });
    const data = await res.json();
    if (data.error) {
        return { success: false, error: data.error };
    }
    return { success: true, messageId: data.messages?.[0]?.id, phone: num };
}

async function sendWithFallback(to, primaryTemplate, fallbackTemplate, components) {
    const result = await callMetaAPI(to, primaryTemplate, components);
    if (!result) return null;
    if (!result.success && TEMPLATE_NOT_READY_CODES.includes(Number(result.error?.code))) {
        console.warn(`    ⚠️  "${primaryTemplate}" in review → using fallback`);
        return await callMetaAPI(to, fallbackTemplate, components);
    }
    return result;
}

const LOCATION_HEADER = {
    type: 'header',
    parameters: [{ type: 'location', location: {
        latitude: '16.6913', longitude: '74.2449',
        name: 'Tara Fitness Centre',
        address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur'
    }}]
};

// ── Senders ──────────────────────────────────────────────────────────────────

function sendExpiryReminder(phone, name, planName, daysLeft) {
    return sendWithFallback(phone,
        'membership_expiry_reminder_template',
        'membership_expiry_reminder_template', // same — no fallback needed
        [
            LOCATION_HEADER,
            { type: 'body', parameters: [
                { type: 'text', text: String(name    || 'Member') },
                { type: 'text', text: String(planName|| 'Plan')   },
                { type: 'text', text: String(daysLeft|| '0')      }
            ]}
        ]
    );
}

function sendExpiredAlert(phone, name, planName) {
    return sendWithFallback(phone,
        'membership_expired_template',
        'membership_expired_template',
        [
            LOCATION_HEADER,
            { type: 'body', parameters: [
                { type: 'text', text: String(name    || 'Member') },
                { type: 'text', text: String(planName|| 'Plan')   }
            ]}
        ]
    );
}

function sendOverdueReminder(phone, name, planName) {
    return sendWithFallback(phone,
        'membership_overdue_reminder_template',
        'membership_overdue_reminder_template',
        [
            LOCATION_HEADER,
            { type: 'body', parameters: [
                { type: 'text', text: String(name    || 'Member') },
                { type: 'text', text: String(planName|| 'Plan')   }
            ]}
        ]
    );
}

function sendCashPendingReminder(phone, name, planName, amount) {
    return callMetaAPI(phone,
        'cash_payment_request_template',
        [{ type: 'body', parameters: [
            { type: 'text', text: String(name    || 'Member') },
            { type: 'text', text: String(planName|| 'Plan')   },
            { type: 'text', text: String(amount  || '0').replace(/[^0-9.]/g, '') }
        ]}]
    );
}

function sendPaymentReceipt(phone, name, planName, amount, startDate, endDate) {
    const comps = [{ type: 'body', parameters: [
        { type: 'text', text: String(name    || 'Member') },
        { type: 'text', text: String(planName|| 'Plan')   },
        { type: 'text', text: String(amount  || '0').replace(/[^0-9.]/g, '') },
        { type: 'text', text: String(startDate|| '')      },
        { type: 'text', text: String(endDate  || '')      }
    ]}];
    return sendWithFallback(phone,
        'payment_receipt_template',
        'payment_receipt_template_fallback',
        comps
    );
}

// ── Counters ─────────────────────────────────────────────────────────────────
const stats = {
    usersScanned : 0,
    noPhone      : 0,
    expiry7      : 0,
    expiry3      : 0,
    expiry1      : 0,
    expired      : 0,
    overdue      : 0,
    cashPending  : 0,
    errors       : 0
};

function fmt(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n' + '═'.repeat(65));
    console.log('  TARA FITNESS — REAL-TIME WHATSAPP BLAST');
    if (DRY_RUN) console.log('  ⚠️  DRY-RUN MODE — no messages will actually be sent');
    console.log('  Date:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    console.log('═'.repeat(65));

    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅ Connected to MongoDB\n');

    const now = new Date();

    // ── STEP 1: Membership-based alerts ──────────────────────────────────────
    console.log('──────────────────────────────────────────────────────────');
    console.log('  STEP 1: Scanning ALL active memberships...');
    console.log('──────────────────────────────────────────────────────────');

    const memberships = await Membership.find({}).populate('userId');

    for (const mem of memberships) {
        const user = mem.userId;
        if (!user || user.role !== 'user') continue;
        if (!user.phone) { stats.noPhone++; continue; }

        stats.usersScanned++;
        const endDate  = new Date(mem.endDate);
        const msLeft   = endDate - now;
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        const name     = mem.userName || user.name;
        const plan     = mem.packageName;
        const phone    = user.phone;

        // ① 7-day expiry warning
        if (daysLeft === 7) {
            process.stdout.write(`  📅 7-day reminder → ${name} (${plan}, ends ${fmt(endDate)}): `);
            try {
                const r = await sendExpiryReminder(phone, name, plan, 7);
                console.log(r?.success ? `✅ sent` : `❌ ${r?.error?.message}`);
                if (r?.success) stats.expiry7++;
                else stats.errors++;
            } catch(e) { console.log(`❌ ${e.message}`); stats.errors++; }

        // ② 3-day expiry warning
        } else if (daysLeft === 3) {
            process.stdout.write(`  ⏳ 3-day reminder → ${name} (${plan}, ends ${fmt(endDate)}): `);
            try {
                const r = await sendExpiryReminder(phone, name, plan, 3);
                console.log(r?.success ? `✅ sent` : `❌ ${r?.error?.message}`);
                if (r?.success) stats.expiry3++;
                else stats.errors++;
            } catch(e) { console.log(`❌ ${e.message}`); stats.errors++; }

        // ③ 1-day expiry (urgent)
        } else if (daysLeft === 1) {
            process.stdout.write(`  🚨 1-day reminder → ${name} (${plan}, ends ${fmt(endDate)}): `);
            try {
                const r = await sendExpiryReminder(phone, name, plan, 1);
                console.log(r?.success ? `✅ sent` : `❌ ${r?.error?.message}`);
                if (r?.success) stats.expiry1++;
                else stats.errors++;
            } catch(e) { console.log(`❌ ${e.message}`); stats.errors++; }

        // ④ Expired (within last 3 days, to catch any the cron missed)
        } else if (daysLeft <= 0 && daysLeft >= -3 && mem.status !== 'cancelled') {
            process.stdout.write(`  🚫 Expired alert → ${name} (${plan}, expired ${fmt(endDate)}): `);
            try {
                const r = await sendExpiredAlert(phone, name, plan);
                console.log(r?.success ? `✅ sent` : `❌ ${r?.error?.message}`);
                if (r?.success) stats.expired++;
                else stats.errors++;
            } catch(e) { console.log(`❌ ${e.message}`); stats.errors++; }
        }

        // Small delay to be polite to Meta API
        await new Promise(r => setTimeout(r, 200));
    }

    // ── STEP 2: Pay-later overdue payments ───────────────────────────────────
    console.log('\n──────────────────────────────────────────────────────────');
    console.log('  STEP 2: Scanning overdue pay-later payments...');
    console.log('──────────────────────────────────────────────────────────');

    const overduePayments = await Payment.find({
        paymentMethod    : 'pay_later',
        verificationStatus: { $in: ['pending', 'overdue'] }
    });

    for (const payment of overduePayments) {
        // Only overdue if expiryDate has passed
        if (payment.expiryDate && now <= payment.expiryDate) continue;

        const user = await User.findOne({ email: new RegExp(`^${payment.email}$`, 'i') });
        if (!user || user.role !== 'user' || !user.phone) continue;

        process.stdout.write(`  💳 Overdue payment → ${user.name} (${payment.planName}): `);
        try {
            const r = await sendOverdueReminder(user.phone, user.name, payment.planName);
            console.log(r?.success ? `✅ sent` : `❌ ${r?.error?.message}`);
            if (r?.success) stats.overdue++;
            else stats.errors++;
        } catch(e) { console.log(`❌ ${e.message}`); stats.errors++; }

        await new Promise(r => setTimeout(r, 200));
    }

    // ── STEP 3: Cash pending payments ────────────────────────────────────────
    console.log('\n──────────────────────────────────────────────────────────');
    console.log('  STEP 3: Scanning cash-on-bench pending payments...');
    console.log('──────────────────────────────────────────────────────────');

    const cashPending = await Payment.find({
        paymentMethod    : 'cash_on_bench',
        verificationStatus: 'cash_pending'
    });

    for (const payment of cashPending) {
        // Only remind if pending for more than 1 day
        const ageHours = (now - new Date(payment.createdAt)) / (1000 * 60 * 60);
        if (ageHours < 24) continue;

        const user = await User.findOne({ email: new RegExp(`^${payment.email}$`, 'i') });
        if (!user || user.role !== 'user' || !user.phone) continue;

        process.stdout.write(`  💵 Cash pending reminder → ${user.name} (${payment.planName}): `);
        try {
            const r = await sendCashPendingReminder(user.phone, user.name, payment.planName, payment.planPrice);
            console.log(r?.success ? `✅ sent` : `❌ ${r?.error?.message}`);
            if (r?.success) stats.cashPending++;
            else stats.errors++;
        } catch(e) { console.log(`❌ ${e.message}`); stats.errors++; }

        await new Promise(r => setTimeout(r, 200));
    }

    // ── SUMMARY ──────────────────────────────────────────────────────────────
    const totalSent = stats.expiry7 + stats.expiry3 + stats.expiry1 + stats.expired + stats.overdue + stats.cashPending;

    console.log('\n' + '═'.repeat(65));
    console.log('  BLAST COMPLETE' + (DRY_RUN ? ' (DRY-RUN)' : ''));
    console.log('═'.repeat(65));
    console.log(`  Users scanned        : ${stats.usersScanned}`);
    console.log(`  Skipped (no phone)   : ${stats.noPhone}`);
    console.log(`  7-day reminders sent : ${stats.expiry7}`);
    console.log(`  3-day reminders sent : ${stats.expiry3}`);
    console.log(`  1-day reminders sent : ${stats.expiry1}`);
    console.log(`  Expired alerts sent  : ${stats.expired}`);
    console.log(`  Overdue reminders    : ${stats.overdue}`);
    console.log(`  Cash-pending nudges  : ${stats.cashPending}`);
    console.log('  ─────────────────────────────────────────────────────');
    console.log(`  Total messages sent  : ${totalSent}`);
    console.log(`  Errors               : ${stats.errors}`);
    console.log('═'.repeat(65) + '\n');

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
