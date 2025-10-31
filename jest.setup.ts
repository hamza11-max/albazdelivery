import '@testing-library/jest-dom/extend-expect';
import { jest, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
import { cleanup } from '@testing-library/react';
import 'cross-fetch/polyfill';

import './__tests__/setup/testing-library-setup';

// Mock Web APIs
interface Port {
  postMessage: () => void;
  onmessage: () => void;
  close: () => void;
}

class MockMessageChannel {
  port1: Port;
  port2: Port;

  constructor() {
    this.port1 = {
      postMessage: () => {},
      onmessage: () => {},
      close: () => {},
    };
    this.port2 = {
      postMessage: () => {},
      onmessage: () => {},
      close: () => {},
    };
  }
}

Object.assign(global, {
  TextEncoder,
  TextDecoder,
  Response: class {
    constructor() {
      return {
        json: () => Promise.resolve({}),
        ok: true,
        status: 200,
        headers: new Headers(),
      };
    }
  },
  Headers: class {
    append() {}
    get() {}
    set() {}
  },
  BroadcastChannel: class {
    constructor() {
      return {
        postMessage: () => {},
        onmessage: () => {},
        close: () => {},
      };
    }
  },
  MessageChannel: MockMessageChannel,
});

// Mock fetch API
type FetchFunc = typeof fetch;
const mockFetch: FetchFunc = jest.fn(async () =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
    headers: new Headers(),
  } as Response)
);

Object.defineProperty(globalThis, 'fetch', { value: mockFetch, writable: true });

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies() {
    return new Map();
  },
  headers() {
    return new Map();
  },
}));

// Custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = Boolean(received);
    return {
      message: () =>
        pass
          ? 'Expected element to not be in the document'
          : 'Expected element to be in the document',
      pass,
    };
  },
});

beforeAll(() => {
  // Any global setup
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  // Any global cleanup
});

// Mock localStorage
const localStorageMock = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string): string | null => store[key] || null),
    setItem: jest.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string): void => {
      delete store[key];
    }),
    clear: jest.fn((): void => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    }),
    length: 0,
    key: jest.fn((index: number): string | null => Object.keys(store)[index] || null),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock browser APIs
const mockWindow = {
  ResizeObserver: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  IntersectionObserver: class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  },
  matchMedia: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
};

Object.defineProperty(window, 'ResizeObserver', { value: mockWindow.ResizeObserver });
Object.defineProperty(window, 'IntersectionObserver', { value: mockWindow.IntersectionObserver });
Object.defineProperty(window, 'matchMedia', { value: mockWindow.matchMedia });