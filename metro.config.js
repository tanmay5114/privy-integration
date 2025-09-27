const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'url': require.resolve('url'),
  'http': require.resolve('stream-http'),
  'https': require.resolve('https-browserify'),
  'stream': require.resolve('stream-browserify'), // Solves the current error
  'crypto': require.resolve('react-native-crypto'), // For 'crypto'
  'zlib': require.resolve('browserify-zlib'), // For 'zlib'
  'util': require.resolve('util'), // For 'util'
  'assert': require.resolve('assert'), // Often needed
  'os': require.resolve('os-browserify/browser'), // Often needed
  'path': require.resolve('path-browserify'), // Often needed
  'vm': require.resolve('vm-browserify'), // Often needed
};
module.exports = withNativeWind(config, { input: './global.css' });
