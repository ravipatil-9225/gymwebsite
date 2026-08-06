require('dotenv').config();
const mongoose = require('mongoose');
const NotificationLog = require('./models/NotificationLog');
const whatsappService = require('./services/whatsappService');
const User = require('./models/User');

async function retryFailedLogs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Get logs from the last 2 days that failed or are stuck in pending
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
        
        const logsToRetry = await NotificationLog.find({
            status: { $in: ['failed', 'pending'] },
            createdAt: { $gte: since }
        }).populate('userId');

        if (logsToRetry.length === 0) {
            console.log('No failed or pending notifications found in the last 48 hours. Everything is clean!');
            process.exit(0);
        }

        console.log(`Found ${logsToRetry.length} notifications to retry. Processing...`);

        let successCount = 0;
        let failCount = 0;

        for (const log of logsToRetry) {
            const user = log.userId;
            const data = log.payload;
            let result = null;

            try {
                // Determine the correct function based on eventType
                switch(log.eventType) {
                    case 'payment_confirmed':
                        result = await whatsappService.sendPaymentConfirmedMessage(user, data, data?.documentUrl);
                        break;
                    case 'cash_payment_request':
                        result = await whatsappService.sendPaymentPendingMessage(user, data, data?.documentUrl);
                        break;
                    case 'upi_payment_pending':
                        result = await whatsappService.sendUpiPaymentPendingUser(data);
                        break;
                    case 'user_registered':
                        result = await whatsappService.sendWelcomeMessage(user);
                        break;
                    case 'membership_expiry_reminder':
                        result = await whatsappService.sendExpiryReminder(data);
                        break;
                    case 'membership_overdue_reminder':
                        result = await whatsappService.sendOverdueReminder(data);
                        break;
                    case 'membership_expired':
                        result = await whatsappService.sendExpiredAlert(data);
                        break;
                    default:
                        console.log(`Unknown eventType: ${log.eventType} for log ${log._id}`);
                        continue;
                }

                if (result && result.success) {
                    // Update log to sent
                    log.status = 'sent';
                    log.messageId = result.messageId;
                    log.retryCount = (log.retryCount || 0) + 1;
                    log.lastRetryAt = new Date();
                    await log.save();
                    successCount++;
                    console.log(`✅ Success retrying ${log.eventType} for ${user?.email || data?.email || 'User'}`);
                } else if (result === null) {
                    // It returned null, which means it skipped (e.g. admin role)
                    log.status = 'permanent_failure';
                    log.metaError = { message: 'Skipped deliberately (e.g. admin role)' };
                    await log.save();
                    console.log(`⏭️ Skipped ${log.eventType} (likely an admin role)`);
                }
            } catch (err) {
                failCount++;
                console.error(`❌ Failed retrying ${log.eventType} for log ${log._id}:`, err.message);
                
                log.status = 'failed';
                log.metaError = err.metaError || { message: err.message };
                log.retryCount = (log.retryCount || 0) + 1;
                log.lastRetryAt = new Date();
                await log.save();
            }
            
            // Add a small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`\n🎉 Finished processing. Success: ${successCount} | Failed: ${failCount}`);
        
    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

retryFailedLogs();
