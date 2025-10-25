import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

type CustomMatchers<R = unknown> = {
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
};

declare global {
  namespace jest {
    interface Matchers<R> extends CustomMatchers<R> {}
  }
}

const expectElement = (element: HTMLElement | null) => {
  return expect(element) as unknown as jest.Matchers<void> & CustomMatchers<void>;
};

export { expectElement };