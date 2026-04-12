import type { expect } from '@jest/globals';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare global {
  interface Window {
    /**
     * Populated at runtime by the Google Maps JS API (see components/ui/map-tracking).
     * Kept loose so the repo does not depend on @types/google.maps in every consumer.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any
  }
}

declare module '@jest/globals' {
  export declare const expect: {
    <T = any>(actual: T): TestingLibraryMatchers<typeof expect.stringContaining, T>;
    extend: (matchers: any) => void;
    stringContaining: (expected: string) => any;
    objectContaining: <T = any>(expected: Partial<T>) => T;
    // ... other properties from jest's expect
  };
}