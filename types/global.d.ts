import type { expect } from '@jest/globals';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module '@jest/globals' {
  export declare const expect: {
    <T = any>(actual: T): TestingLibraryMatchers<typeof expect.stringContaining, T>;
    extend: (matchers: any) => void;
    stringContaining: (expected: string) => any;
    objectContaining: <T = any>(expected: Partial<T>) => T;
    // ... other properties from jest's expect
  };
}