/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare global {
  namespace jest {
    interface JestMatchers<T> extends TestingLibraryMatchers<T, void> {}
  }
}