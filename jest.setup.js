import '@testing-library/jest-dom'
import fetchMock from 'jest-fetch-mock'

// Enable fetch mocks globally so tests can call `global.fetch.mock...`
fetchMock.enableMocks()

// Ensure `global.fetch` has Jest mock helpers in case something overwrote it
// Replace global.fetch with a robust Jest mock implementation that
// always provides `mockResolvedValueOnce` and `mockRejectedValueOnce` helpers.
// This ensures tests that call these helpers won't fail if some library
// or module overwrote `global.fetch` earlier.
{
  // Create a getter/setter wrapper on globalThis.fetch so any code that
  // assigns a new fetch implementation will automatically be wrapped into
  // a Jest mock that exposes `mockResolvedValueOnce` / `mockRejectedValueOnce`.
  const createMockWrapper = (targetFn) => {
    // If already a Jest mock, return as-is
    if (typeof targetFn === 'function' && targetFn._isMockFunction) return targetFn

    const m = jest.fn((...args) => {
      // If the original assigned value was a function, call it
      if (typeof targetFn === 'function') {
        return targetFn(...args)
      }
      // Default: return a resolved empty response
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    // Ensure helper methods exist
    if (typeof m.mockResolvedValueOnce !== 'function') {
      m.mockResolvedValueOnce = (value) => m.mockImplementationOnce(() => Promise.resolve(value))
    }
    if (typeof m.mockRejectedValueOnce !== 'function') {
      m.mockRejectedValueOnce = (err) => m.mockImplementationOnce(() => Promise.reject(err))
    }

    return m
  }

  let inner = createMockWrapper(undefined)

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    enumerable: true,
    get() {
      return inner
    },
    set(val) {
      // Wrap any assigned value so tests can rely on Jest mock helpers
      inner = createMockWrapper(val)
    },
  })

  // If a fetch implementation already exists on globalThis (polyfill), wrap it
  if (typeof globalThis.fetch === 'function') {
    const existing = globalThis.fetch
    globalThis.fetch = createMockWrapper(existing)
  }
}

// Conditionally setup MSW if available (for UI tests that need it)
// This prevents test failures if MSW is not properly installed
let server = null;
try {
  const mswModule = require('./__tests__/mocks/server');
  server = mswModule.server;
  
  if (server && typeof server.listen === 'function') {
    // Establish API mocking before all tests.
    beforeAll(() => server.listen());

    // Reset any request handlers that we may add during the tests,
    // so they don't affect other tests.
    afterEach(() => server.resetHandlers());

    // Clean up after the tests are finished.
    afterAll(() => server.close());
  }
} catch (error) {
  // MSW not available or not needed for these tests
  // This is fine - not all tests require MSW
  console.warn('[Jest Setup] MSW server not available, skipping setup. This is OK if tests don\'t need it.');
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: null,
      status: 'unauthenticated',
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Set test environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
