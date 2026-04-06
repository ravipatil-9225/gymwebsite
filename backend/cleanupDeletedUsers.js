require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Membership = require('./models/Membership');
const Payment = require('./models/Payment');
const FormSubmission = require('./models/FormSubmission');

async function runCleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for cleanup...");

        // Collect all existing user emails and IDs
        const users = await User.find({}, 'email _id');
        const validEmails = new Set(users.map(u => u.email.toLowerCase()));
        const validUserIds = new Set(users.map(u => u._id.toString()));

        // Delete Memberships where userId doesn't exist
        const memberships = await Membership.find({});
        let deletedMemberships = 0;
        for (const m of memberships) {
            if (!validUserIds.has(m.userId.toString())) {
                await Membership.findByIdAndDelete(m._id);
                // Also clean up any forms under this email
                if (m.userEmail) {
                    await FormSubmission.deleteMany({ email: m.userEmail });
                }
                deletedMemberships++;
            }
        }
        
        // Delete Payments where email doesn't exist in validEmails
        const payments = await Payment.find({});
        let deletedPayments = 0;
        for (const p of payments) {
            if (p.email && !validEmails.has(p.email.toLowerCase())) {
                await Payment.findByIdAndDelete(p._id);
                // Also clean up any forms under this email
                await FormSubmission.deleteMany({ email: p.email });
                deletedPayments++;
            }
        }
        
        console.log(`Cleanup complete. Deleted: ${deletedMemberships} Orphaned Memberships, ${deletedPayments} Orphaned Payments.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runCleanup();
