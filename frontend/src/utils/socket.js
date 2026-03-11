import { io } from 'socket.io-client';

// Use production backend URL if deployed, otherwise fallback to local
const url = import.meta.env.PROD || process.env.NODE_ENV === 'production'
    ? 'https://gymwebsite-g5vx.onrender.com'
    : 'http://localhost:5000';

const socket = io(url, {
    autoConnect: true,
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
});

export default socket;
