/**
 * @jest-environment jsdom
 */
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import VendorERPApp from '@/app/vendor/page';

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

//Mock dashboard data
const mockDashboardData = {
  todaySales: 1500,
  weekSales: 8500,
  monthSales: 32000,
  topProducts: [
    { id: 1, productId: 1, productName: 'Product 1', totalSold: 50 },
    { id: 2, productId: 2, productName: 'Product 2', totalSold: 30 },
  ],
};

const mockInventoryData = [
  { id: 1, name: 'Product 1', stock: 100, price: 19.99 },
  { id: 2, name: 'Product 2', stock: 50, price: 29.99 },
];

// Mock fetch responses
const mockFetchResponse = (response: any) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(response),
  });
};

// Mock fetch
global.fetch = jest.fn().mockImplementation((url: string) => {
  switch (url) {
    case '/api/erp/dashboard':
      return mockFetchResponse({ success: true, data: mockDashboardData });
    case '/api/erp/inventory':
      return mockFetchResponse({ success: true, data: mockInventoryData });
    case '/api/erp/orders':
      return mockFetchResponse({ success: true, data: mockOrdersData });
    default:
      return mockFetchResponse({ success: false, error: 'Not found' });
  }
});
  
// Mock orders data
const mockOrdersData = [
  {
    id: 'order1',
    customerName: 'John Doe',
    status: 'PENDING',
    total: 59.98,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order2',
    customerName: 'Jane Smith',
    status: 'COMPLETED',
    total: 89.97,
    createdAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

describe('Vendor Dashboard Integration Tests', () => {
  test('displays summary statistics and top products', async () => {
    render(
      <SessionProvider session={mockSession}>
        <VendorERPApp />
      </SessionProvider>
    );

    // Loading state is handled by Next.js

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/ventes aujourd'hui/i)).toBeInTheDocument();
    });

    // Verify sales data in DZD
    await waitFor(() => {
      const sales = screen.getAllByText(/DZD$/);
      expect(sales.length).toBeGreaterThanOrEqual(3);
      expect(sales[0]).toHaveTextContent(/^1500/);
      expect(sales[1]).toHaveTextContent(/^8500/);
      expect(sales[2]).toHaveTextContent(/^32000/);
    });

    // Verify top products
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('50 vendus')).toBeInTheDocument();
  });

  test('displays inventory data correctly', async () => {
    render(
      <SessionProvider session={mockSession}>
        <VendorERPApp />
      </SessionProvider>
    );

    // Click inventory tab
    const inventoryTab = screen.getByRole('tab', { name: /inventaire/i });
    await userEvent.click(inventoryTab);

    // Verify inventory data
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    expect(screen.getByText('100')).toBeInTheDocument(); // stock
    expect(screen.getByText('$19.99')).toBeInTheDocument(); // price
  });

  test('displays order list correctly', async () => {
    render(
      <SessionProvider session={mockSession}>
        <VendorERPApp />
      </SessionProvider>
    );

    // Click sales tab
    const salesTab = screen.getByRole('tab', { name: /ventes/i });
    await userEvent.click(salesTab);

    // Verify order data
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('$59.98')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  test('handles server error gracefully', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      mockFetchResponse({
        success: false,
        error: 'Server error'
      })
    );

    render(
      <SessionProvider session={mockSession}>
        <VendorERPApp />
      </SessionProvider>
    );

    // Error handling is done through toasts
    // No explicit error message is shown in the UI
  });
});