const io = require('socket.io-client');
const http = require('http');
const https = require('https');

const socket = io('https://gymwebsite-g5vx.onrender.com', {
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('[PROD] Connected to Render socket with ID:', socket.id);
    
    // Simulate user registering with a randomly generated email
    const randomEmail = `test${Date.now()}@example.com`;
    const data = JSON.stringify({
      name: 'RealTime Tester',
      email: randomEmail,
      phone: '9876543210',
      password: 'password123'
    });

    const options = {
      hostname: 'gymwebsite-g5vx.onrender.com',
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    console.log('[PROD] Making test registration POST directly to Render...', randomEmail);
    const req = https.request(options, (res) => {
      console.log(`[PROD] Registration HTTP Status: ${res.statusCode}`);
      res.on('data', d => console.log('Response:', d.toString()));
    });

    req.on('error', e => console.error('[PROD] Req error:', e));
    req.write(data);
    req.end();
});

socket.on('db_changed', (payload) => {
    console.log('✅ [PROD] RECEIVED db_changed EVENT FROM RENDER!', payload);
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('[PROD] Socket connect error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('❌ [PROD] TIMEOUT! Did not receive db_changed event within 15 seconds.');
    process.exit(1);
}, 15000);
