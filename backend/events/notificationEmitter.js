const EventEmitter = require('events');

class NotificationEmitter extends EventEmitter {}

// Create a singleton instance
const notificationEmitter = new NotificationEmitter();

module.exports = notificationEmitter;
