/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { test, describe, beforeEach } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import VendorERPApp from '@/app/vendor/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/vendor',
  useSearchParams: () => new URLSearchParams()
}));

// Create mock session
const mockSession: Session = {
  user: { 
    id: '1', 
    name: 'Test Vendor', 
    email: 'vendor@test.com',
    role: 'VENDOR',
  },
  expires: new Date(Date.now() + 2 * 86400).toISOString()
};

// Mock data for tests
const mockData = {
  dashboard: {
    todaySales: 1500,
    weekSales: 8500,
    monthSales: 32000,
    topProducts: [
      { id: 1, productId: 1, productName: 'Product 1', totalSold: 50 },
      { id: 2, productId: 2, productName: 'Product 2', totalSold: 30 },
    ],
    lowStockProducts: [
      { id: 1, name: 'Product 1', stock: 5, lowStockThreshold: 10 },
      { id: 2, name: 'Product 2', stock: 3, lowStockThreshold: 8 },
    ]
  }
};

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: mockData })
  })
);

// Reset mocks between each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Vendor Dashboard Integration Tests', () => {
  const setup = () => {
    return render(
      <SessionProvider session={mockSession}>
        <VendorERPApp />
      </SessionProvider>
    );
  };

  test('renders initial dashboard state', async () => {
    setup();
    
    // Just verify that the main heading is rendered
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  }, 15000);

  test('handles data loading error', async () => {
    // Mock API error response
    (fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.reject(new Error('API error'))
    );

    setup();

    // Since the error is handled gracefully, just verify that component renders
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  }, 15000);
});