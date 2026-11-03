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

const fs = require('fs');
const path = require('path');

const SYNC_STATE_FILE = path.join(__dirname, 'last_sync.json');

function loadLastProcessedSn() {
    try {
        if (fs.existsSync(SYNC_STATE_FILE)) {
            const raw = fs.readFileSync(SYNC_STATE_FILE, 'utf8');
            const data = JSON.parse(raw);
            if (typeof data.lastProcessedSn === 'number') {
                return data.lastProcessedSn;
            }
        }
    } catch (e) {
        console.warn('⚠️ Could not load last_sync.json:', e.message);
    }
    return null;
}

function saveLastProcessedSn(sn) {
    try {
        fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify({ lastProcessedSn: sn, lastUpdated: new Date().toISOString() }, null, 2));
    } catch (e) {
        console.warn('⚠️ Could not save last_sync.json:', e.message);
    }
}

let lastProcessedSn = 0;
let isPolling = false;
let pollTimer = null;
let zkInstance = null;
let isConnected = false;

// NOTE: Machine denial (voice/beep) is intentionally disabled.
// Expired plans are silently rejected in the backend — no noise on machine.
async function triggerMachineDenial() {
    // Disabled — machine will show its normal scan result without extra alerts
}

// Send punch to backend API
async function sendPunchToCloud(deviceUserId, recordTime) {
    const cleanDeviceUserId = String(deviceUserId || '').replace(/\0/g, '').trim();
    if (!cleanDeviceUserId) {
        console.warn('⚠️ Skipping empty biometric deviceUserId');
        return { success: true };
    }

    let timestamp;
    try {
        const parsed = new Date(recordTime);
        timestamp = !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
    } catch (_) {
        timestamp = new Date().toISOString();
    }

    try {
        console.log(`\n👉 Fingerprint Punch Detected -> User #${cleanDeviceUserId} at ${timestamp}`);

        const response = await axios.post(CLOUD_API_URL, {
            deviceUserId: cleanDeviceUserId,
            timestamp,
            secret: BRIDGE_SECRET
        }, { timeout: 8000 });

        if (response.data?.success) {
            console.log(`✅ [SUCCESS] ${response.data.message}`);
        } else {
            console.log(`ℹ️ [INFO] ${response.data?.message || 'Processed'}`);
        }
        return { success: true };
    } catch (err) {
        if (err.response) {
            console.error(`❌ [SERVER ERROR] ${err.response.status} - ${err.response.data?.message || err.message}`);
            // Check if plan is expired (403 Forbidden with planExpired: true flag)
            if (err.response.status === 403 && err.response.data?.planExpired) {
                console.log(`⛔ [DENIED] Plan Expired for User #${deviceUserId}. Triggering machine voice/beep denial...`);
                await triggerMachineDenial();
            }
            // 4xx errors (400, 403, 404) mean server processed the request, so don't get stuck retrying
            if (err.response.status < 500) {
                return { success: true };
            }
            // 5xx errors mean backend crashed or is restarting — retry later
            return { success: false, retry: true };
        } else {
            console.error(`⚠️ [NETWORK ERROR] Cloud API unreachable: ${err.message}`);
            return { success: false, retry: true };
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

        // Guard against machine log clears or serial resets
        if (logs.length > 0) {
            const currentMaxSn = Math.max(...logs.map(log => log.userSn || 0));
            if (currentMaxSn < lastProcessedSn) {
                console.warn(`🔄 [LOG RESET DETECTED] Machine logs cleared/reset (device max serial #${currentMaxSn} < last #${lastProcessedSn}). Resetting sync cursor.`);
                lastProcessedSn = 0;
            }
        }
        
        // Filter only new logs that have a higher serial number than what we have processed
        const newLogs = logs.filter(log => log.userSn > lastProcessedSn);
        
        if (newLogs.length > 0) {
            console.log(`\n📥 Found ${newLogs.length} new punch log(s) on machine.`);
            
            // Sort new logs ascending by userSn so we process them in the exact order they happened
            newLogs.sort((a, b) => a.userSn - b.userSn);

            for (const log of newLogs) {
                const res = await sendPunchToCloud(String(log.deviceUserId), log.recordTime);
                if (res.success) {
                    lastProcessedSn = log.userSn;
                    saveLastProcessedSn(lastProcessedSn);
                } else if (res.retry) {
                    console.warn(`⏳ Network or server unreachable. Halting sync at serial #${log.userSn}. Will retry automatically.`);
                    break; // Keep unprocessed punches in queue for next poll
                }
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

        // Fetch logs to check for any offline punches that occurred while PC was OFF
        const initialLogs = await zkInstance.getAttendances();
        const data = initialLogs?.data || [];
        const savedSn = loadLastProcessedSn();
        const maxDeviceSn = data.length > 0 ? Math.max(...data.map(log => log.userSn || 0)) : 0;

        if (savedSn !== null && savedSn <= maxDeviceSn) {
            lastProcessedSn = savedSn;
            console.log(`📌 Resumed from last sync state: Last processed serial #${lastProcessedSn}`);

            // Any punches made while PC was OFF will have userSn > lastProcessedSn
            const offlinePunches = data.filter(log => log.userSn > lastProcessedSn);
            if (offlinePunches.length > 0) {
                console.log(`⚡ Found ${offlinePunches.length} punch(es) recorded while PC was OFF! Catching up now...`);
                offlinePunches.sort((a, b) => a.userSn - b.userSn);
                for (const log of offlinePunches) {
                    const res = await sendPunchToCloud(String(log.deviceUserId), log.recordTime);
                    if (res.success) {
                        lastProcessedSn = log.userSn;
                        saveLastProcessedSn(lastProcessedSn);
                    } else if (res.retry) {
                        console.warn(`⏳ Network unreachable during offline catch-up. Halting at serial #${log.userSn}. Will retry automatically.`);
                        break;
                    }
                }
                console.log(`✅ Offline catch-up phase complete. Last processed record serial is #${lastProcessedSn}`);
            } else {
                console.log(`✨ All punches are up to date. No offline punches pending.`);
            }
        } else if (data.length > 0) {
            // First time running or machine logs were reset
            lastProcessedSn = maxDeviceSn;
            saveLastProcessedSn(lastProcessedSn);
            console.log(`📌 Initialized: Last processed record serial is #${lastProcessedSn}`);
        } else {
            console.log('📌 Initialized: Machine log is empty, waiting for new scans.');
            lastProcessedSn = 0;
            saveLastProcessedSn(0);
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

// ── Crash-proof: Never let the agent die silently ─────────────────────────────
// These handlers ensure PM2 can restart on actual crashes, and log everything.
process.on('uncaughtException', (err) => {
    console.error(`\n💥 [UNCAUGHT EXCEPTION] ${err.message}`);
    console.error(err.stack);
    // Give 2s for logs to flush, then crash so PM2 can restart us
    setTimeout(() => process.exit(1), 2000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`\n⚠️ [UNHANDLED REJECTION]`, reason);
    // Unhandled rejections don't crash the process — just log them
});

startAgent();
