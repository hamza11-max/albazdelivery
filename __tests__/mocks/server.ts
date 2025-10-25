import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Define handlers
export const handlers = [
  http.post('/api/payments/create-intent', () => {
    return HttpResponse.json({
      success: true,
      clientSecret: 'test_client_secret',
    });
  }),

  http.post('/api/payments/verify', () => {
    return HttpResponse.json({
      success: true,
      paymentId: 'test_payment_id',
    });
  }),

  http.get('/api/erp/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: {
        todaySales: 1500,
        weekSales: 8500,
        monthSales: 32000,
        topProducts: [
          { id: 1, name: 'Product 1', sales: 50 },
          { id: 2, name: 'Product 2', sales: 30 },
        ],
        lowStockProducts: [
          { id: 3, name: 'Product 3', stock: 5 },
        ],
      },
    });
  }),

  http.get('/api/erp/inventory', () => {
    return HttpResponse.json({
      success: true,
      data: {
        products: [
          { id: 1, name: 'Product 1', stock: 100, price: 10 },
          { id: 2, name: 'Product 2', stock: 50, price: 20 },
        ],
      },
    });
  }),
];

// Create test server
export const server = setupServer(...handlers);