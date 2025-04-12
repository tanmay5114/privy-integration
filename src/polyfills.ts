// src/polyfills.ts
// This file provides polyfills for Node.js built-ins used by various crypto libraries

import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Import core crypto functionality
import 'react-native-get-random-values';
import 'react-native-quick-crypto';

// Ensure process is available
import process from 'process';
if (!global.process) {
  global.process = process;
}

// Additional globals that might be needed
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

// Warn on missing global instead of crashing
const originalGet = Object.getOwnPropertyDescriptor(Object.prototype, '__lookupGetter__')?.value;
if (originalGet) {
  Object.defineProperty(Object.prototype, '__lookupGetter__', {
    value: function(prop: string) {
      try {
        return originalGet.call(this, prop);
      } catch (e) {
        console.warn('__lookupGetter__ polyfill error:', e);
        return undefined;
      }
    },
    configurable: true,
    enumerable: false,
  });
}

// Export a function that ensures Buffer is available
export const ensureBuffer = () => {
  if (typeof global.Buffer === 'undefined') {
    console.warn('Buffer is not defined, attempting to polyfill again');
    global.Buffer = Buffer;
  }
  return global.Buffer;
}; 