import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Mock router implementation
const mockedRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

// Mock useRouter hook
export function useRouter() {
  return mockedRouter;
}

// Mock usePathname hook
export function usePathname() {
  return '/vendor';
}

// Mock useSearchParams hook
export function useSearchParams() {
  return new URLSearchParams();
}

// Export mocked functions for test manipulation
export const mockRouter = mockedRouter;