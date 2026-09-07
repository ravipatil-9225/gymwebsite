/**
 * audit_all_whatsapp_templates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Full audit of ALL 7 WhatsApp templates used in the gym system.
 * Checks NotificationLog delivery status for each template.
 *
 * Usage (local DB):
 *   node scratch/audit_all_whatsapp_templates.js
 *
 * Usage (live Render DB):
 *   $env:MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/dbname"; node scratch/audit_all_whatsapp_templates.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const NotificationLog = require('../models/NotificationLog');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const User = require('../models/User');

// ── IST helper ────────────────────────────────────────────────────
function toIST(d) {
    return new Date(new Date(d).getTime() + 5.5 * 60 * 60 * 1000);
}
function daysUntilIST(endDate, now) {
    const e = toIST(endDate); e.setHours(0,0,0,0);
    const n = toIST(now);     n.setHours(0,0,0,0);
    return Math.round((e - n) / 86400000);
}
function pad(str, len) { return String(str || '').substring(0, len).padEnd(len); }
function hr(char, len) { return char.repeat(len); }

// ── All 7 templates with metadata ─────────────────────────────────
const TEMPLATES = [
    {
        templateName:  'welcome_message_template',
        eventType:     'user_registered',
        trigger:       'When a new member registers',
        triggerFile:   'notificationEngine.js → user_registered event',
        sendFn:        'whatsappService.sendWelcomeMessage(user)',
        params:        '{{1}}=name',
    },
    {
        templateName:  'payment_receipt_template',
        eventType:     'payment_confirmed',
        trigger:       'When admin confirms a payment (UPI auto or manual)',
        triggerFile:   'notificationEngine.js → payment_confirmed event',
        sendFn:        'whatsappService.sendPaymentReceiptMessage(user, paymentData)',
        params:        '{{1}}=name, {{2}}=plan, {{3}}=amount, {{4}}=startDate, {{5}}=endDate',
    },
    {
        templateName:  'payment_receipt_template_fallback',
        eventType:     'payment_confirmed',
        trigger:       'Auto-fallback when payment_receipt_template is still "in review" on Meta',
        triggerFile:   'whatsappService.js → sendWithFallback()',
        sendFn:        'whatsappService.sendPaymentReceiptMessage (fallback path)',
        params:        '{{1}}=name, {{2}}=plan, {{3}}=amount, {{4}}=startDate, {{5}}=endDate',
    },
    {
        templateName:  'cash_payment_request_template',
        eventType:     'cash_payment_request',
        trigger:       'When member chooses "Cash on Bench" payment method',
        triggerFile:   'notificationEngine.js → cash_payment_request event',
        sendFn:        'whatsappService.sendPaymentPendingMessage(user, paymentData)',
        params:        '{{1}}=name, {{2}}=plan, {{3}}=amount',
    },
    {
        templateName:  'upi_payment_pending_template',
        eventType:     'upi_payment_pending',
        trigger:       'When member submits UPI payment (awaiting admin verify)',
        triggerFile:   'notificationEngine.js → upi_payment_pending event',
        sendFn:        'whatsappService.sendUpiPaymentPendingUser(paymentData)',
        params:        'Header=location, {{1}}=name, {{2}}=transactionId',
    },
    {
        templateName:  'membership_expiry_reminder_template',
        eventType:     'membership_expiry_reminder',
        trigger:       'At 3 days OR 7 days before plan expiry (daily cron 9AM IST)',
        triggerFile:   'cron/membershipReminder.js + cron/paymentMonitor.js',
        sendFn:        'whatsappService.sendExpiryReminder({name, email, planName, daysLeft})',
        params:        'Header=location, {{1}}=name, {{2}}=plan, {{3}}=daysLeft',
    },
    {
        templateName:  'membership_expired_template',
        eventType:     'membership_expired',
        trigger:       'On the day a plan expires (daysLeft <= 0), daily cron 9AM IST',
        triggerFile:   'cron/membershipReminder.js → reminderExpirySent flag',
        sendFn:        'whatsappService.sendExpiredAlert({name, email, planName})',
        params:        'Header=location, {{1}}=name, {{2}}=plan',
    },
    {
        templateName:  'membership_overdue_reminder_template',
        eventType:     'membership_overdue_reminder',
        trigger:       'When a pay-later payment is past its due date (daily cron 9AM IST)',
        triggerFile:   'cron/paymentMonitor.js → overdueReminderSent flag',
        sendFn:        'whatsappService.sendOverdueReminder({name, email, planName})',
        params:        'Header=location, {{1}}=name, {{2}}=plan',
    },
];

async function auditTemplate(tmpl) {
    // Get ALL logs for this template
    const allLogs = await NotificationLog.find({ templateName: tmpl.templateName })
        .sort({ createdAt: -1 });

    // Also check by eventType (catches logs where templateName might differ)
    const byEvent = await NotificationLog.find({ eventType: tmpl.eventType })
        .sort({ createdAt: -1 });

    // Combine unique
    const combined = [...allLogs];
    for (const l of byEvent) {
        if (!combined.find(x => String(x._id) === String(l._id))) combined.push(l);
    }
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total      = combined.length;
    const sent       = combined.filter(l => l.status === 'sent').length;
    const failed     = combined.filter(l => l.status === 'failed').length;
    const permFail   = combined.filter(l => l.status === 'permanent_failure').length;
    const pending    = combined.filter(l => l.status === 'pending').length;
    const latest5    = combined.slice(0, 5);

    return { ...tmpl, total, sent, failed, permFail, pending, latest5, combined };
}

async function run() {
    const MONGO = process.env.MONGO_URI;
    console.log('\nConnecting to:', MONGO);
    await mongoose.connect(MONGO);
    console.log('Connected.\n');

    const now = new Date();

    // ── SECTION 1: Template-by-template audit ────────────────────────────────
    console.log(hr('=', 120));
    console.log('  WHATSAPP TEMPLATE DELIVERY AUDIT — ALL 7 TEMPLATES');
    console.log(hr('=', 120));

    const results = [];
    for (const tmpl of TEMPLATES) {
        results.push(await auditTemplate(tmpl));
    }

    for (const r of results) {
        const statusIcon = r.total === 0 ? '⚠️ NEVER USED'
            : r.sent === r.total ? '✅ ALL SENT'
            : r.failed + r.permFail > 0 ? '❌ HAS FAILURES'
            : '⏳ MIXED';

        console.log('\n' + hr('─', 120));
        console.log(`TEMPLATE: ${r.templateName}`);
        console.log(`  Event Type : ${r.eventType}`);
        console.log(`  Trigger    : ${r.trigger}`);
        console.log(`  Trigger In : ${r.triggerFile}`);
        console.log(`  Params     : ${r.params}`);
        console.log(hr('─', 80));
        console.log(`  STATUS     : ${statusIcon}`);
        console.log(`  Total logs : ${r.total}  |  Sent: ${r.sent}  |  Failed: ${r.failed}  |  Perm Fail: ${r.permFail}  |  Pending: ${r.pending}`);

        if (r.latest5.length > 0) {
            console.log(`  Last ${r.latest5.length} log(s):`);
            for (const log of r.latest5) {
                const t = log.createdAt
                    ? new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    : '-';
                const err = log.metaError
                    ? (log.metaError.message || JSON.stringify(log.metaError).substring(0, 80))
                    : '';
                console.log(
                    '    [' + pad(log.status.toUpperCase(), 18) + ']',
                    pad(log.phone, 14),
                    '|', t,
                    err ? '| ERR: ' + err : ''
                );
            }
        } else {
            console.log('  ⚠️  NO LOGS IN DATABASE — this template has never fired.');
        }
    }

    // ── SECTION 2: Current state of members who SHOULD have gotten alerts ────
    console.log('\n\n' + hr('=', 120));
    console.log('  LIVE DATA CHECK — Members who SHOULD have received alerts');
    console.log(hr('=', 120));

    // 2a: Active memberships expiring in 7 days — should have gotten reminder
    const activeMemberships = await Membership.find({ status: 'active' });
    const expiringSoon = [];
    const alreadyExpiredActive = []; // still active but past end date (bug)
    for (const m of activeMemberships) {
        if (!m.endDate) continue;
        const d = daysUntilIST(m.endDate, now);
        if (d <= 7 && d > 0) expiringSoon.push({ m, d });
        else if (d <= 0) alreadyExpiredActive.push({ m, d });
    }

    // 2b: Expired memberships — should have gotten expired alert
    const expiredMemberships = await Membership.find({ status: 'expired' });

    console.log('\n[A] Active memberships expiring in 1-7 days (should get expiry reminder):');
    if (expiringSoon.length === 0) {
        console.log('    None currently expiring in 1-7 days.');
    } else {
        console.log(`    Found: ${expiringSoon.length}`);
        console.log('    ' + pad('NAME', 22) + pad('EMAIL', 30) + pad('PLAN', 22) + pad('END DATE', 12) + pad('DAYS', 6) + pad('R7_SENT', 8) + pad('R3_SENT', 8));
        console.log('    ' + hr('-', 108));
        for (const { m, d } of expiringSoon) {
            console.log(
                '    ' +
                pad(m.userName, 22) +
                pad(m.userEmail, 30) +
                pad(m.packageName, 22) +
                pad(m.endDate ? new Date(m.endDate).toLocaleDateString('en-IN') : '-', 12) +
                pad(d + 'd left', 6) +
                pad(m.reminder7Sent ? 'YES' : 'NO', 8) +
                pad(m.reminder3Sent ? 'YES' : 'NO', 8)
            );
        }
    }

    console.log('\n[B] "Active" memberships that are PAST their end date (cron should have expired + alerted):');
    if (alreadyExpiredActive.length === 0) {
        console.log('    None. (Good — no stuck "active" records)');
    } else {
        console.log(`    ⚠️  Found ${alreadyExpiredActive.length} memberships still marked "active" but past end date!`);
        console.log('    ' + pad('NAME', 22) + pad('EMAIL', 30) + pad('PLAN', 22) + pad('END DATE', 12) + pad('DAYS', 10) + pad('EXP_SENT', 9));
        console.log('    ' + hr('-', 105));
        for (const { m, d } of alreadyExpiredActive) {
            console.log(
                '    ' +
                pad(m.userName, 22) +
                pad(m.userEmail, 30) +
                pad(m.packageName, 22) +
                pad(m.endDate ? new Date(m.endDate).toLocaleDateString('en-IN') : '-', 12) +
                pad(Math.abs(d) + 'd ago', 10) +
                pad(m.reminderExpirySent ? 'YES' : 'NO', 9)
            );
        }
        console.log('\n  ⚠️  These members are stuck as "active" — the cron will NOT process them (it only looks');
        console.log('      at active records where daysLeft <= 0 to flip to expired + send alert).');
        console.log('      BUT the cron DID process them once: if reminderExpirySent=YES they got the email,');
        console.log('      but we need to check if the WhatsApp actually fired too.');
    }

    console.log('\n[C] Expired memberships — checking if expired alert was sent:');
    const noAlert = [];
    const gotAlert = [];
    for (const m of expiredMemberships) {
        if (m.reminderExpirySent) gotAlert.push(m);
        else noAlert.push(m);
    }
    console.log(`    Total expired memberships: ${expiredMemberships.length}`);
    console.log(`    reminderExpirySent = YES  : ${gotAlert.length} (cron processed them)`);
    console.log(`    reminderExpirySent = NO   : ${noAlert.length} (cron NEVER processed — expired before cron ran or cron was down)`);

    // ── SECTION 3: Pay-later overdue payment check ───────────────────────────
    console.log('\n[D] Pay-later overdue payments — overdue reminder status:');
    const overduePayments = await Payment.find({ paymentMethod: 'pay_later', verificationStatus: 'overdue' });
    const overdueNoReminder = overduePayments.filter(p => !p.overdueReminderSent);
    console.log(`    Total overdue pay-later payments: ${overduePayments.length}`);
    console.log(`    overdueReminderSent = YES        : ${overduePayments.length - overdueNoReminder.length}`);
    console.log(`    overdueReminderSent = NO         : ${overdueNoReminder.length}`);

    // ── SECTION 4: Registration check — recent users ─────────────────────────
    console.log('\n[E] Recent new member registrations — welcome WhatsApp check:');
    const recentUsers = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(10);
    console.log(`    Checking last 10 registered users:`);
    console.log('    ' + pad('NAME', 22) + pad('EMAIL', 32) + pad('PHONE', 14) + pad('REGISTERED', 20) + 'WELCOME WA?');
    console.log('    ' + hr('-', 100));
    for (const u of recentUsers) {
        let waStatus = 'NOT CHECKED';
        if (u.phone) {
            const cleanPhone = String(u.phone).replace(/\D/g, '').slice(-10);
            const log = await NotificationLog.findOne({
                phone: { $regex: cleanPhone },
                eventType: 'user_registered'
            }).sort({ createdAt: -1 });
            waStatus = log ? log.status.toUpperCase() : 'NO LOG';
        } else {
            waStatus = 'NO PHONE';
        }
        const regDate = u.createdAt
            ? new Date(u.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
            : '-';
        console.log(
            '    ' +
            pad(u.name, 22) +
            pad(u.email, 32) +
            pad(u.phone || 'N/A', 14) +
            pad(regDate, 20) +
            waStatus
        );
    }

    // ── SECTION 5: Overall summary ───────────────────────────────────────────
    console.log('\n\n' + hr('=', 120));
    console.log('  OVERALL SUMMARY');
    console.log(hr('=', 120));
    const totalLogs = await NotificationLog.countDocuments();
    const totalSent = await NotificationLog.countDocuments({ status: 'sent' });
    const totalFailed = await NotificationLog.countDocuments({ status: 'failed' });
    const totalPermFail = await NotificationLog.countDocuments({ status: 'permanent_failure' });
    const totalPending = await NotificationLog.countDocuments({ status: 'pending' });

    console.log(`  Total WhatsApp notification logs : ${totalLogs}`);
    console.log(`  Sent successfully                : ${totalSent}`);
    console.log(`  Failed (retryable)               : ${totalFailed}`);
    console.log(`  Permanent failure                : ${totalPermFail}`);
    console.log(`  Pending                          : ${totalPending}`);

    // Per-template summary table
    console.log('\n  Per-Template Summary:');
    console.log('  ' + pad('TEMPLATE', 42) + pad('TOTAL', 8) + pad('SENT', 8) + pad('FAILED', 8) + pad('PERM_FAIL', 10) + 'STATUS');
    console.log('  ' + hr('-', 90));
    for (const r of results) {
        const st = r.total === 0 ? 'NEVER USED'
            : r.sent === r.total ? 'ALL OK'
            : r.failed + r.permFail > 0 ? 'HAS FAILURES'
            : 'PARTIAL';
        console.log(
            '  ' +
            pad(r.templateName, 42) +
            pad(r.total, 8) +
            pad(r.sent, 8) +
            pad(r.failed, 8) +
            pad(r.permFail, 10) +
            st
        );
    }

    // ── SECTION 6: Critical issue detection ─────────────────────────────────
    console.log('\n' + hr('=', 120));
    console.log('  CRITICAL ISSUES DETECTED');
    console.log(hr('=', 120));

    let issues = 0;

    if (totalLogs === 0) {
        console.log('\n  🔴 CRITICAL: NotificationLog collection is EMPTY.');
        console.log('     The notificationEngine.js setupListeners() may not be running on the server.');
        console.log('     Check that index.js imports notificationEngine: require("./services/notificationEngine")');
        issues++;
    }

    const neverUsed = results.filter(r => r.total === 0).map(r => r.templateName);
    if (neverUsed.length > 0) {
        console.log('\n  🟡 TEMPLATES NEVER USED (0 logs):');
        neverUsed.forEach(t => console.log('     - ' + t));
        issues++;
    }

    const hasFailures = results.filter(r => r.failed + r.permFail > 0);
    if (hasFailures.length > 0) {
        console.log('\n  🔴 TEMPLATES WITH FAILURES:');
        for (const r of hasFailures) {
            console.log(`     - ${r.templateName}: ${r.failed} failed, ${r.permFail} permanent failures`);
            // Show most recent error
            const lastFailed = r.combined.find(l => l.status !== 'sent');
            if (lastFailed && lastFailed.metaError) {
                const errMsg = lastFailed.metaError.message || JSON.stringify(lastFailed.metaError).substring(0, 100);
                console.log(`       Last error: ${errMsg}`);
            }
        }
        issues++;
    }

    if (alreadyExpiredActive.length > 0) {
        console.log(`\n  🟡 ${alreadyExpiredActive.length} memberships are PAST end date but still "active" status.`);
        console.log('     The cron will keep trying to process them daily — but they should have been flipped already.');
        issues++;
    }

    if (noAlert.length > 0) {
        console.log(`\n  🟡 ${noAlert.length} expired memberships have reminderExpirySent = false.`);
        console.log('     These members never received the expired email+WhatsApp alert.');
        issues++;
    }

    if (issues === 0) {
        console.log('\n  ✅ No critical issues detected!');
    }

    console.log('\n' + hr('=', 120));
    console.log('  Audit complete. Run against LIVE DB with:');
    console.log('  $env:MONGO_URI="mongodb+srv://..."; node scratch/audit_all_whatsapp_templates.js');
    console.log(hr('=', 120) + '\n');

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
