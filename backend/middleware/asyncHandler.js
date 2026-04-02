/**
 * asyncHandler — Wraps async route controllers to catch unhandled promise rejections.
 * Instead of crashing the server, it forwards all errors to the Global Error Handler.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
