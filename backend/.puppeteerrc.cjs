const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to a directory inside the project
  // so that Render preserves the downloaded Chrome browser across builds.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
