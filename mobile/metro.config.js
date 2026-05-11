const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prefer the 'main' field (CJS) over ESM to avoid resolution issues with nested dependencies
// like engine.io-client which Metro sometimes struggles with in newer versions.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
