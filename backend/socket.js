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
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.IO not initialized!');
        }
        return io;
    },
};
