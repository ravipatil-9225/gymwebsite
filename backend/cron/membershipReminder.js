/**
 * membershipReminder.js — Membership Expiry Cron Job
 * Runs daily at 9AM IST to send expiry reminder emails for 7-day, 3-day, and expiry-day.
 */

const cron = require('node-cron');
const Membership = require('../models/Membership');
const { sendExpiryReminder } = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

const startMembershipReminderCron = () => {
    // Runs every day at 9:00 AM IST (3:30 AM UTC)
    cron.schedule('30 3 * * *', async () => {
        console.log('🕒 Running membership expiry reminder cron job...');

        try {
            const now = new Date();
            const memberships = await Membership.find({ status: 'active' });

            let processed = 0;

            for (const membership of memberships) {
                const msLeft = new Date(membership.endDate) - now;
                const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

                // Mark expired
                if (daysLeft <= 0) {
                    if (!membership.reminderExpirySent) {
                        await sendExpiryReminder(membership, 0);
                        // Trigger WhatsApp expiry reminder (expired)
                        await whatsappService.sendExpiryReminder({
                            name: membership.userName,
                            email: membership.userEmail,
                            planName: membership.packageName,
                            daysLeft: 0
                        }).catch(console.error);

                        membership.reminderExpirySent = true;
                        membership.status = 'expired';
                        await membership.save();
                        console.log(`⚠️  Expiry email & WhatsApp sent to ${membership.userEmail}`);
                        processed++;
                    }
                }
                // 3-day reminder
                else if (daysLeft <= 3 && !membership.reminder3Sent) {
                    await sendExpiryReminder(membership, daysLeft);
                    // Trigger WhatsApp expiry reminder
                    await whatsappService.sendExpiryReminder({
                        name: membership.userName,
                        email: membership.userEmail,
                        planName: membership.packageName,
                        daysLeft: daysLeft
                    }).catch(console.error);

                    membership.reminder3Sent = true;
                    await membership.save();
                    console.log(`⏳ 3-day reminder email & WhatsApp sent to ${membership.userEmail}`);
                    processed++;
                }
                // 7-day reminder
                else if (daysLeft <= 7 && !membership.reminder7Sent) {
                    await sendExpiryReminder(membership, daysLeft);
                    membership.reminder7Sent = true;
                    await membership.save();
                    console.log(`📅 7-day reminder email sent to ${membership.userEmail}`);
                    processed++;
                }
            }

            console.log(`✅ Cron job complete. Processed ${processed} membership reminder(s).`);
        } catch (err) {
            console.error('❌ Membership cron error:', err.message);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('📅 Membership expiry reminder cron job registered (daily at 9:00 AM IST).');
};

module.exports = { startMembershipReminderCron };
