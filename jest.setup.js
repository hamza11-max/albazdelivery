import '@testing-library/jest-dom'

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
