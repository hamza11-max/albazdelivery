import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(css: string | object): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toHaveValue(value?: string | string[] | number | null): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeRequired(): R;
    }
  }
}

export {};