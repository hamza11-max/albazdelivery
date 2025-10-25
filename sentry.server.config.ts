// This file configures the initialization of Sentry on the server.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
  
  // Enable Error and Crash Reporting
  enabled: process.env.NODE_ENV === 'production',
  
  // Configure Environment
  environment: process.env.NODE_ENV,
  
  // Ignore specific errors
  ignoreErrors: [
    // Add patterns for errors you want to ignore
    'ResizeObserver loop limit exceeded',
    'Network request failed',
  ],
  
  // Configure error tags
  initialScope: {
    tags: {
      'app.version': process.env.npm_package_version,
    },
  },
  
  // Adjust this value in production based on your needs
  maxBreadcrumbs: 50,
});