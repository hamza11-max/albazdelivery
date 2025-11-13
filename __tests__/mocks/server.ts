// Conditional MSW setup - handle import errors gracefully
let server: any = null;

try {
  // Try to import MSW - this may fail in Jest if module resolution is problematic
  const mswNode = require('msw/node');
  const { setupServer } = mswNode;
  
  // Try to import handlers
  let handlers: any[] = [];
  try {
    const handlersModule = require('./handlers');
    handlers = handlersModule.handlers || [];
  } catch (handlerError) {
    // Handlers not available, use empty array
    handlers = [];
  }
  
  server = setupServer(...handlers);
} catch (error: any) {
  // MSW not available or module resolution issue
  // Create a mock server that does nothing
  server = {
    listen: () => {},
    resetHandlers: () => {},
    close: () => {},
    use: () => {},
    restoreHandlers: () => {},
  };
  // Only warn in development/test environments
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[MSW] Could not load MSW server, using mock implementation:', error?.message || error);
  }
}

export { server };
