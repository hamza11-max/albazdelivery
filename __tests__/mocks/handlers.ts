import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';

export const handlers: HttpHandler[] = [
  // @ts-expect-error - MSW v2 has strict type requirements for response resolvers
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;
    
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin'
        },
        token: 'test-jwt-token'
      });
    }
    
    return new HttpResponse(null, { status: 401 });
  }),

  // @ts-expect-error - MSW v2 has strict type requirements for response resolvers
  http.get('/api/vendor/orders', () => {
    return HttpResponse.json({
      orders: [
        { id: '1', status: 'pending', total: 29.99 },
        { id: '2', status: 'completed', total: 59.99 }
      ]
    });
  }),

  // @ts-expect-error - MSW v2 has strict type requirements for response resolvers
  http.get('/api/vendor/inventory', () => {
    return HttpResponse.json({
      inventory: [
        { id: '1', name: 'Product 1', stock: 10 },
        { id: '2', name: 'Product 2', stock: 5 }
      ]
    });
  }),

  // @ts-expect-error - MSW v2 has strict type requirements for response resolvers
  http.get('/api/driver/deliveries', () => {
    return HttpResponse.json({
      deliveries: [
        { id: '1', status: 'in_transit', address: '123 Main St' },
        { id: '2', status: 'delivered', address: '456 Oak Ave' }
      ]
    });
  }),

  // @ts-expect-error - MSW v2 has strict type requirements for response resolvers
  http.get('/api/customer/orders', () => {
    return HttpResponse.json({
      orders: [
        { id: '1', status: 'shipped', total: 29.99 },
        { id: '2', status: 'delivered', total: 59.99 }
      ]
    });
  })
];
