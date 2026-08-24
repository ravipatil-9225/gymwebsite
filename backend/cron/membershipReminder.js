/**
 * membershipReminder.js — Membership Expiry Cron Job
 * Runs daily at 9AM IST to send expiry reminder emails for 7-day, 3-day, and expiry-day.
 */

const cron = require('node-cron');
const Membership = require('../models/Membership');
const { sendExpiryReminder } = require('../services/emailService');
const notificationEmitter = require('../events/notificationEmitter');
const User = require('../models/User');
const { daysUntilIST, sleep } = require('../utils/dateUtils');

const runMembershipReminderLogic = async () => {
    console.log('🕒 Running membership expiry reminder cron job...');

        try {
            const now = new Date();
            const memberships = await Membership.find({ status: 'active' });

            let processed = 0;

            for (const membership of memberships) {
              // Per-record isolation: a single bad membership must not abort the whole batch.
              try {
                // Whole days left on IST calendar boundaries (server clock is UTC on Render).
                const daysLeft = daysUntilIST(membership.endDate, now);

                // Mark expired
                if (daysLeft <= 0) {
                    if (!membership.reminderExpirySent) {
                        await sendExpiryReminder(membership, 0);
                        const userDoc = await User.findById(membership.userId);
                        if (userDoc) {
                            notificationEmitter.emit('membership_expired', {
                                user: userDoc,
                                reminderData: {
                                    name: membership.userName,
                                    email: membership.userEmail,
                                    planName: membership.packageName
                                }
                            });
                        }
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
                    const userDoc = await User.findById(membership.userId);
                    if (userDoc) {
                        notificationEmitter.emit('membership_expiry_reminder', {
                            user: userDoc,
                            reminderData: {
                                name: membership.userName,
                                email: membership.userEmail,
                                planName: membership.packageName,
                                daysLeft: daysLeft
                            }
                        });
                    }
                    membership.reminder3Sent = true;
                    await membership.save();
                    console.log(`⏳ 3-day reminder email & WhatsApp sent to ${membership.userEmail}`);
                    processed++;
                }
                // 7-day reminder
                else if (daysLeft <= 7 && !membership.reminder7Sent) {
                    await sendExpiryReminder(membership, daysLeft);
                    const userDoc7 = await User.findById(membership.userId);
                    if (userDoc7) {
                        notificationEmitter.emit('membership_expiry_reminder', {
                            user: userDoc7,
                            reminderData: {
                                name: membership.userName,
                                email: membership.userEmail,
                                planName: membership.packageName,
                                daysLeft: daysLeft
                            }
                        });
                    }
                    membership.reminder7Sent = true;
                    await membership.save();
                    console.log(`📅 7-day reminder email & WhatsApp sent to ${membership.userEmail}`);
                    processed++;
                }
              } catch (recErr) {
                    console.error(`❌ Skipping membership ${membership?._id} (${membership?.userEmail}) due to error:`, recErr.message);
              }

              // Gentle spacing so a big same-day batch never bursts past Meta's rate limit.
              await sleep(300);
            }

            console.log(`✅ Cron job complete. Processed ${processed} membership reminder(s).`);
        } catch (err) {
            console.error('❌ Membership cron error:', err.message);
        }
    };

const startMembershipReminderCron = () => {
    cron.schedule('0 9 * * *', runMembershipReminderLogic, {
        timezone: 'Asia/Kolkata'
    });

    console.log('📅 Membership expiry reminder cron job registered (daily at 9:00 AM IST).');
};

module.exports = { startMembershipReminderCron, runMembershipReminderLogic };
