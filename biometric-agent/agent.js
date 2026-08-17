require('dotenv').config();
const ZKLib = require('zklib-js');
const axios = require('axios');

const DEVICE_IP = process.env.DEVICE_IP || '192.168.1.201';
const DEVICE_PORT = parseInt(process.env.DEVICE_PORT || '4370');
const CLOUD_API_URL = process.env.CLOUD_API_URL || 'http://localhost:5000/api/attendance/biometric-punch';
const BRIDGE_SECRET = process.env.BIOMETRIC_BRIDGE_SECRET || 'gym_biometric_secret_2026';
const RECONNECT_DELAY_MS = 10000;

console.log('====================================================');
console.log('⚡ ZKTeco K40 Pro Local Biometric Agent Initializing');
console.log(`📌 Machine IP   : ${DEVICE_IP}:${DEVICE_PORT}`);
console.log(`☁️ Cloud Endpoint: ${CLOUD_API_URL}`);
console.log('====================================================');

// Send punch to backend API
async function sendPunchToCloud(log) {
    try {
        const deviceUserId = String(log.userId || log.uid || log.user_id);
        const timestamp = log.attTime || log.timestamp || new Date().toISOString();

        console.log(`\n👉 Fingerprint Punch Detected -> User #${deviceUserId} at ${timestamp}`);

        const response = await axios.post(CLOUD_API_URL, {
            deviceUserId,
            timestamp,
            secret: BRIDGE_SECRET
        }, { timeout: 5000 });

        if (response.data?.success) {
            console.log(`✅ [SUCCESS] ${response.data.message}`);
        } else {
            console.log(`ℹ️ [INFO] ${response.data?.message || 'Processed'}`);
        }
    } catch (err) {
        if (err.response) {
            console.error(`❌ [SERVER ERROR] ${err.response.status} - ${err.response.data?.message || err.message}`);
        } else {
            console.error(`⚠️ [NETWORK ERROR] Cloud API unreachable: ${err.message}`);
        }
    }
}

async function startAgent() {
    const zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);

    try {
        console.log(`\n⏳ Connecting to ZKTeco K40 Pro machine at ${DEVICE_IP}:${DEVICE_PORT}...`);
        await zkInstance.createSocket();
        console.log('✅ Connected to ZKTeco K40 Pro device successfully!');

        // Subscribe to real-time events from device
        await zkInstance.getRealTimeLogs(async (log) => {
            if (log) {
                await sendPunchToCloud(log);
            }
        });

        console.log('📡 Real-time listener active. Ready for thumb scans!');
    } catch (err) {
        console.error(`❌ Failed to connect to machine (${err.message}). Retrying in 10 seconds...`);
        try {
            await zkInstance.disconnect();
        } catch (_) {}
        setTimeout(startAgent, RECONNECT_DELAY_MS);
    }
}

// Handle exit gracefully
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down biometric agent...');
    process.exit(0);
});

startAgent();
