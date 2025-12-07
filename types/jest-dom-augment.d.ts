/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom/extend-expect';

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeRequired(): R;
      // include other commonly used matchers if needed
    }
  }
}

export {};
