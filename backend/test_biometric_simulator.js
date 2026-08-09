const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api/attendance/biometric-punch';
const SECRET = process.env.BIOMETRIC_BRIDGE_SECRET || 'gym_biometric_secret_2026';

async function testBiometricPunch(deviceUserId) {
    console.log(`\n🧪 Testing Biometric Punch for Device User ID #${deviceUserId}...`);
    try {
        const res = await axios.post(API_URL, {
            deviceUserId: String(deviceUserId),
            timestamp: new Date().toISOString(),
            secret: SECRET
        });

        console.log('✅ Response Status:', res.status);
        console.log('📦 Response Data  :', JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.error('❌ API Error:', err.response.status, err.response.data);
        } else {
            console.error('❌ Connection Error:', err.message);
        }
    }
}

// Pass device user id as command line argument or default to 15
const targetId = process.argv[2] || '15';
testBiometricPunch(targetId);
