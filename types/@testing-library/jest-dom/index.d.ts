// Minimal ambient types for @testing-library/jest-dom to satisfy editor when node_modules isn't installed.
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
    toBeVisible(): R;
  }
}

declare module '@testing-library/jest-dom' {
  // no exports needed; this module augments jest matchers
}

export {};
