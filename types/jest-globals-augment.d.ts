import 'jest';
import '@testing-library/jest-dom';

declare module '@jest/globals' {
  // Ensure the `expect` exported from '@jest/globals' uses the jest namespace
  // which has been augmented by @testing-library/jest-dom
  export const expect: jest.Expect;
}

export {};
