/**
 * Jest setup for API route tests (Node.js environment)
 */

import { jest, beforeEach, afterEach } from '@jest/globals'

// Mock crypto.randomUUID for Node.js environment
// This ensures crypto.randomUUID is available in Jest tests
try {
  const nodeCrypto = require('crypto')
  const randomUUID = nodeCrypto.randomUUID.bind(nodeCrypto)
  const getRandomValues = nodeCrypto.randomFillSync.bind(nodeCrypto)
  
  // Set up crypto for global (Node.js environment)
  if (!global.crypto) {
    (global as any).crypto = {}
  }
  if (!global.crypto.randomUUID) {
    (global as any).crypto.randomUUID = randomUUID
  }
  if (!global.crypto.getRandomValues) {
    (global as any).crypto.getRandomValues = getRandomValues
  }
  
  // Set up crypto for globalThis (works in both Node and browser-like environments)
  if (!globalThis.crypto) {
    (globalThis as any).crypto = {}
  }
  if (!globalThis.crypto.randomUUID) {
    (globalThis as any).crypto.randomUUID = randomUUID
  }
  if (!globalThis.crypto.getRandomValues) {
    (globalThis as any).crypto.getRandomValues = getRandomValues
  }
  
  // Also ensure it's available as a direct property
  if (typeof (global as any).crypto === 'undefined') {
    (global as any).crypto = (globalThis as any).crypto
  }
} catch (e) {
  // Fallback if crypto module is not available (shouldn't happen in Node.js)
  console.warn('Could not load crypto module for testing:', e)
}

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})

