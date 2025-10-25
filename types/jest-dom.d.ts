/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeRequired(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(css: string | object): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toHaveValue(value?: string | string[] | number | null): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
    }
  }
}