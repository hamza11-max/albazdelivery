import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

interface WrapperProps {
  children: ReactNode;
}

function Providers({ children }: WrapperProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}

const customRender = (ui: ReactElement, options = {}) =>
  render(ui, {
    wrapper: Providers,
    ...options,
  });

export * from '@testing-library/react';
export { customRender as render };