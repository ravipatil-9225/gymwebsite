const socketIo = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        io = socketIo(httpServer, {
            cors: {
                origin: '*', // Allow all origins for dev/prod flexibility
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
            },
        });
        console.log('Socket.IO initialized');

        io.on('connection', (socket) => {
            console.log(`🔌 New client connected: ${socket.id}`);
            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.IO not initialized!');
        }
        return io;
    },
};
