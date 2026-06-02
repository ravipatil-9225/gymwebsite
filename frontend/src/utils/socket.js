import { io } from 'socket.io-client';

// Use production backend URL if deployed, otherwise fallback to local
const url = import.meta.env.PROD
    ? 'https://gymwebsite-1-kj55.onrender.com'
    : `http://${window.location.hostname}:5000`;

const socket = io(url, {
    autoConnect: true,
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
});

export default socket;
