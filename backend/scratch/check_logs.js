require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const NotificationLog = require('../models/NotificationLog');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const totalLogs = await NotificationLog.countDocuments();
    console.log(`Total notification logs in DB: ${totalLogs}`);

    const logs = await NotificationLog.find().sort({ createdAt: -1 }).limit(20);
    console.log('\n--- LAST 20 LOGS ---');
    logs.forEach(log => {
        console.log(`ID: ${log._id}`);
        console.log(`  Phone: ${log.phone}`);
        console.log(`  Template: ${log.templateName}`);
        console.log(`  Status: ${log.status}`);
        console.log(`  MetaError:`, JSON.stringify(log.metaError));
        console.log(`  Created: ${log.createdAt}`);
        console.log('-----------------------------');
    });

    await mongoose.disconnect();
}

main().catch(console.error);
