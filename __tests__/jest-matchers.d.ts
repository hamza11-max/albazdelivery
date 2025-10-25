import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface AsymmetricMatchers {
      toBeInTheDocument(): void;
      toHaveAttribute(attr: string, value?: string): void;
    }

    interface Matchers<R = void, T = {}> {
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
      toHaveFocus(): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveDescription(text: string | RegExp): R;
    }

    interface ExpectExtendMap {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }
}