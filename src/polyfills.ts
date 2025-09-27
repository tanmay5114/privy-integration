// polyfills-alt.ts
// Import order is crucial - start with the most basic polyfills

// 1. Random values first (required by many crypto operations)
import 'react-native-get-random-values';

// 2. Text encoding
import 'fast-text-encoding';

// 3. Process polyfill
import process from 'process';
if (typeof global.process === 'undefined') {
  global.process = process;
}

// 4. Buffer polyfill
import { Buffer } from 'buffer';
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// 5. Stream polyfill (required by crypto)
import 'stream-browserify';

// 6. Crypto polyfill
import 'react-native-crypto';

// 7. Global polyfills
import 'react-native-polyfill-globals/auto';

// 8. Ethers shims last
import '@ethersproject/shims';

// Defensive initialization
const initializePolyfills = () => {
  // Ensure crypto is available
  if (!global.crypto) {
    try {
      global.crypto = require('react-native-crypto');
    } catch (e) {
      console.warn('Failed to initialize crypto:', e);
    }
  }

  // Ensure getRandomValues is available
  if (global.crypto && !global.crypto.getRandomValues) {
    try {
      const { getRandomValues } = require('react-native-get-random-values');
      global.crypto.getRandomValues = getRandomValues;
    } catch (e) {
      console.warn('Failed to initialize getRandomValues:', e);
    }
  }

  // Ensure Buffer is available
  if (!global.Buffer) {
    global.Buffer = Buffer;
  }
};

// Initialize immediately
initializePolyfills();

export { initializePolyfills };