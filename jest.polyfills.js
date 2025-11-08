// Add necessary polyfills for Jest
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add TransformStream polyfill for MSW v2
if (typeof global.TransformStream === 'undefined') {
  const { TransformStream } = require('node:stream/web');
  global.TransformStream = TransformStream;
}

// Add ReadableStream polyfill for MSW v2
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream } = require('node:stream/web');
  global.ReadableStream = ReadableStream;
}

// Add WritableStream polyfill for MSW v2
if (typeof global.WritableStream === 'undefined') {
  const { WritableStream } = require('node:stream/web');
  global.WritableStream = WritableStream;
}

// Add BroadcastChannel polyfill for MSW v2
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Add Request and Headers polyfills for MSW v2
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Map();
      this.body = init.body;
      
      if (init.headers) {
        if (init.headers instanceof Map) {
          this.headers = init.headers;
        } else if (typeof init.headers === 'object') {
          Object.entries(init.headers).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        }
      }
    }
    
    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body
      });
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body));
    }
    
    text() {
      return Promise.resolve(this.body);
    }
  };
}

if (typeof global.Headers === 'undefined') {
  global.Headers = Map;
}

// Add Response polyfill for MSW
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = (init && init.status) || 200;
      this.statusText = (init && init.statusText) || 'OK';
      this.headers = new Map();
      
      if (init && init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body));
    }
    
    text() {
      return Promise.resolve(this.body);
    }
  };
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;
