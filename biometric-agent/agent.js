require('dotenv').config();
const ZKLib = require('zklib-js');
const axios = require('axios');

const DEVICE_IP = process.env.DEVICE_IP || '192.168.1.201';
const DEVICE_PORT = parseInt(process.env.DEVICE_PORT || '4370');
const CLOUD_API_URL = process.env.CLOUD_API_URL || 'http://localhost:5000/api/attendance/biometric-punch';
const BRIDGE_SECRET = process.env.BIOMETRIC_BRIDGE_SECRET || 'gym_biometric_secret_2026';
const RECONNECT_DELAY_MS = 10000;
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds for real-time responsiveness

console.log('====================================================');
console.log('⚡ ZKTeco K40 Pro Local Biometric Agent Initializing');
console.log(`📌 Machine IP   : ${DEVICE_IP}:${DEVICE_PORT}`);
console.log(`☁️ Cloud Endpoint: ${CLOUD_API_URL}`);
console.log(`🔄 Sync Mode    : Real-Time Poll (Every ${POLL_INTERVAL_MS / 1000}s)`);
console.log('====================================================');

let lastProcessedSn = 0;
let isPolling = false;
let pollTimer = null;
let zkInstance = null;
let isConnected = false;

// Send punch to backend API
async function sendPunchToCloud(deviceUserId, recordTime) {
    try {
        const timestamp = new Date(recordTime).toISOString();
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

// Fetch and sync new logs
async function pollAttendanceLogs() {
    if (isPolling || !isConnected) return;
    isPolling = true;

    try {
        const attendanceRes = await zkInstance.getAttendances();
        const logs = attendanceRes?.data || [];
        
        // Filter only new logs that have a higher serial number than what we have processed
        const newLogs = logs.filter(log => log.userSn > lastProcessedSn);
        
        if (newLogs.length > 0) {
            console.log(`\n📥 Found ${newLogs.length} new punch log(s) on machine.`);
            
            // Sort new logs ascending by userSn so we process them in the exact order they happened
            newLogs.sort((a, b) => a.userSn - b.userSn);

            for (const log of newLogs) {
                await sendPunchToCloud(String(log.deviceUserId), log.recordTime);
                lastProcessedSn = log.userSn;
            }
        }
    } catch (err) {
        console.error(`⚠️ [CONNECTION LOST] Failed to communicate with machine: ${err.message}`);
        handleDisconnectAndRetry();
    } finally {
        isPolling = false;
    }
}

async function handleDisconnectAndRetry() {
    isConnected = false;
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }

    try {
        console.log('🔄 Cleaning up socket connection...');
        await zkInstance.disconnect();
    } catch (_) {}

    console.log(`⏳ Retrying connection in ${RECONNECT_DELAY_MS / 1000} seconds...`);
    setTimeout(startAgent, RECONNECT_DELAY_MS);
}

async function startAgent() {
    zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);

    try {
        console.log(`\n⏳ Connecting to ZKTeco K40 Pro machine at ${DEVICE_IP}:${DEVICE_PORT}...`);
        await zkInstance.createSocket();
        isConnected = true;
        console.log('✅ Connected to ZKTeco K40 Pro device successfully!');

        // Fetch existing logs to establish baseline lastProcessedSn
        const initialLogs = await zkInstance.getAttendances();
        const data = initialLogs?.data || [];
        if (data.length > 0) {
            lastProcessedSn = Math.max(...data.map(log => log.userSn || 0));
            console.log(`📌 Initialized: Last processed record serial is #${lastProcessedSn}`);
        } else {
            console.log('📌 Initialized: Machine log is empty, waiting for new scans.');
            lastProcessedSn = 0;
        }

        // Start polling loop
        console.log(`📡 Real-time poller active. Scanning every ${POLL_INTERVAL_MS / 1000}s for thumb scans...`);
        pollTimer = setInterval(pollAttendanceLogs, POLL_INTERVAL_MS);

    } catch (err) {
        console.error(`❌ Failed to connect to machine (${err.message}).`);
        handleDisconnectAndRetry();
    }
}

// Handle exit gracefully
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down biometric agent...');
    if (pollTimer) clearInterval(pollTimer);
    try {
        if (zkInstance) await zkInstance.disconnect();
    } catch (_) {}
    process.exit(0);
});

startAgent();
