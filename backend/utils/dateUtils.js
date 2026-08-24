/**
 * dateUtils.js — timezone-safe day math for the reminder crons.
 *
 * The server runs in UTC (Render), but the gym operates in IST (Asia/Kolkata,
 * UTC+5:30). Computing "days left" against the raw UTC clock can be off by one
 * around midnight. These helpers normalise to the IST calendar day so a
 * membership that ends "today in India" is treated as 0 days left everywhere.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/** Returns a Date snapped to 00:00 of the given instant's IST calendar day. */
function startOfDayIST(date = new Date()) {
    const shifted = new Date(date.getTime() + IST_OFFSET_MS);
    shifted.setUTCHours(0, 0, 0, 0);
    return new Date(shifted.getTime() - IST_OFFSET_MS);
}

/**
 * Whole calendar days from now until `target`, measured on IST day boundaries.
 * 0 = ends today (IST), negative = already past, 3 = ends in three days.
 */
function daysUntilIST(target, now = new Date()) {
    const a = startOfDayIST(now).getTime();
    const b = startOfDayIST(new Date(target)).getTime();
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { startOfDayIST, daysUntilIST, sleep, IST_OFFSET_MS };
