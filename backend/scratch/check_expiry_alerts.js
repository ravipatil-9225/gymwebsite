/**
 * check_expiry_alerts.js
 * ─────────────────────────────────────────────────────────────────
 * Diagnostic script to check ALL expiring/expired members and
 * whether they received WhatsApp alerts (notification logs).
 *
 * Run: node scratch/check_expiry_alerts.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const User = require('../models/User');
const NotificationLog = require('../models/NotificationLog');

// ── IST day diff helper ──────────────────────────────────────────
function daysUntilIST(endDate, now) {
    const toIST = (d) => {
        const utc = new Date(d).getTime();
        return new Date(utc + 5.5 * 60 * 60 * 1000);
    };
    const endIST = toIST(endDate);
    const nowIST = toIST(now);
    endIST.setHours(0, 0, 0, 0);
    nowIST.setHours(0, 0, 0, 0);
    return Math.round((endIST - nowIST) / (1000 * 60 * 60 * 24));
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB:', process.env.MONGO_URI);

    const now = new Date();

    // ── 1. Find all memberships that are expired OR expiring (<=7 days left) ──
    const memberships = await Membership.find({});

    const targets = [];
    for (const m of memberships) {
        if (!m.endDate) continue;
        const daysLeft = daysUntilIST(m.endDate, now);
        if (daysLeft <= 7) {
            targets.push({ membership: m, daysLeft });
        }
    }

    console.log('\nTotal memberships with <=7 days left (or expired): ' + targets.length);
    console.log('='.repeat(100));

    // ── 2. For each, lookup user + notification logs ──────────────────────────
    let sentCount = 0, missingCount = 0, failedCount = 0, noPhoneCount = 0;
    const rows = [];

    for (const { membership, daysLeft } of targets) {
        const user = await User.findById(membership.userId);
        const phone = user && user.phone ? user.phone : (membership.userPhone || null);

        let logs = [];
        if (phone) {
            const cleanPhone = String(phone).replace(/\D/g, '');
            logs = await NotificationLog.find({
                phone: { $regex: cleanPhone.slice(-10) },
                eventType: { $in: ['membership_expiry_reminder', 'membership_expired'] }
            }).sort({ createdAt: -1 }).limit(5);
        }

        const latestLog = logs[0];
        let alertStatus = 'NO LOG FOUND';
        let sentAt = '-';

        if (!phone) {
            alertStatus = 'NO PHONE NUMBER';
            noPhoneCount++;
        } else if (latestLog) {
            if (latestLog.status === 'sent') {
                alertStatus = 'SENT';
                sentAt = latestLog.createdAt
                    ? new Date(latestLog.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    : '-';
                sentCount++;
            } else if (latestLog.status === 'failed' || latestLog.status === 'permanent_failure') {
                const errMsg = (latestLog.metaError && (latestLog.metaError.message || (latestLog.metaError.error && latestLog.metaError.error.message))) || 'Unknown error';
                alertStatus = 'FAILED: ' + errMsg;
                failedCount++;
            } else {
                alertStatus = latestLog.status.toUpperCase();
                sentCount++;
            }
        } else {
            missingCount++;
        }

        const statusLabel = daysLeft < 0
            ? 'EXPIRED ' + Math.abs(daysLeft) + 'd ago'
            : daysLeft === 0 ? 'EXPIRES TODAY'
            : daysLeft + 'd left';

        rows.push({
            name: membership.userName || (user && user.name) || '(unknown)',
            email: membership.userEmail || (user && user.email) || '-',
            phone: phone || 'N/A',
            plan: membership.packageName || '-',
            endDate: membership.endDate
                ? new Date(membership.endDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
                : '-',
            statusLabel,
            membershipStatus: membership.status,
            reminder7Sent: membership.reminder7Sent ? 'YES' : 'NO',
            reminder3Sent: membership.reminder3Sent ? 'YES' : 'NO',
            reminderExpirySent: membership.reminderExpirySent ? 'YES' : 'NO',
            alertStatus,
            sentAt
        });
    }

    // ── 3. Print table ────────────────────────────────────────────────────────
    console.log('\nDETAILED REPORT — Expiring/Expired Members & WhatsApp Alert Status\n');
    console.log(
        'NAME'.padEnd(22),
        'PHONE'.padEnd(14),
        'PLAN'.padEnd(20),
        'END DATE'.padEnd(12),
        'DAYS STATUS'.padEnd(18),
        'MEM STATUS'.padEnd(12),
        'R7'.padEnd(5),
        'R3'.padEnd(5),
        'EXP'.padEnd(5),
        'WHATSAPP ALERT'
    );
    console.log('-'.repeat(155));

    for (const r of rows) {
        console.log(
            r.name.substring(0, 21).padEnd(22),
            r.phone.padEnd(14),
            (r.plan || '').substring(0, 19).padEnd(20),
            r.endDate.padEnd(12),
            r.statusLabel.padEnd(18),
            r.membershipStatus.padEnd(12),
            r.reminder7Sent.padEnd(5),
            r.reminder3Sent.padEnd(5),
            r.reminderExpirySent.padEnd(5),
            r.alertStatus
        );
        if (r.sentAt && r.sentAt !== '-') {
            console.log('   └─ Sent at:', r.sentAt);
        }
    }

    // ── 4. Summary ─────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(100));
    console.log('SUMMARY:');
    console.log('  Total expiring/expired members: ' + targets.length);
    console.log('  WhatsApp alert SENT:            ' + sentCount);
    console.log('  No WhatsApp log found:          ' + missingCount);
    console.log('  Failed/permanent failure:       ' + failedCount);
    console.log('  No phone number on record:      ' + noPhoneCount);

    // ── 5. Members who need attention ─────────────────────────────────────────
    const needsAction = rows.filter(r => r.alertStatus.includes('NO LOG') || r.alertStatus.includes('FAILED'));
    if (needsAction.length > 0) {
        console.log('\nMEMBERS WHO DID NOT RECEIVE WHATSAPP ALERTS:');
        console.log('-'.repeat(80));
        for (const r of needsAction) {
            console.log('  * ' + r.name + ' | ' + r.phone + ' | ' + r.email + ' | ' + r.statusLabel + ' | ' + r.alertStatus);
        }
    } else {
        console.log('\nAll trackable members received WhatsApp alerts!');
    }

    // ── 6. Last 10 notification logs ──────────────────────────────────────────
    console.log('\nLAST 10 EXPIRY-RELATED WHATSAPP NOTIFICATION LOGS (most recent first):');
    console.log('-'.repeat(100));
    const recentLogs = await NotificationLog.find({
        eventType: { $in: ['membership_expiry_reminder', 'membership_expired'] }
    }).sort({ createdAt: -1 }).limit(10);

    if (recentLogs.length === 0) {
        console.log('  WARNING: NO expiry-related notification logs found in the database!');
        console.log('  This means the cron job has NOT run yet or notifications were never triggered.');
    } else {
        for (const log of recentLogs) {
            const createdAt = log.createdAt
                ? new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                : '-';
            const errMsg = (log.metaError && (log.metaError.message || (log.metaError.error && log.metaError.error.message))) || '';
            console.log(
                '[' + log.status.toUpperCase().padEnd(18) + ']',
                log.phone.padEnd(15),
                '|',
                log.eventType.padEnd(28),
                '|',
                createdAt,
                errMsg ? '| ERR: ' + errMsg : ''
            );
        }
    }

    console.log('\nDiagnostic complete.\n');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch(function(err) {
    console.error('Fatal error:', err);
    process.exit(1);
});
