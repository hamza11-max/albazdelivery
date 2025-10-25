import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth handlers
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'vendor'
        },
        token: 'mock-jwt-token'
      });
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Vendor handlers  
  http.get('/api/vendor/orders', () => {
    return HttpResponse.json({
      orders: [
        {
          id: '1',
          customerName: 'John Doe', 
          status: 'pending',
          total: 50.00,
          items: [
            {
              id: '1',
              name: 'Test Item',
              quantity: 2, 
              price: 25.00
            }
          ]
        }
      ]
    });
  }),

  http.get('/api/vendor/inventory', () => {
    return HttpResponse.json({
      products: [
        {
          id: '1',
          name: 'Product 1',
          stock: 100,
          price: 10.00
        },
        {
          id: '2',
          name: 'Product 2',
          stock: 50,
          price: 20.00
        }
      ]
    });
  }),

  // Driver handlers
  http.get('/api/driver/deliveries', () => {
    return HttpResponse.json({
      deliveries: [
        {
          id: '1',
          pickupAddress: '123 Pickup St',
          dropoffAddress: '456 Dropoff Ave',
          status: 'assigned'
        }
      ]
    });
  }),

  // Customer handlers
  http.get('/api/customer/orders', () => {
    return HttpResponse.json({
      orders: [
        {
          id: '1',
          vendorName: 'Test Vendor',
          status: 'delivered',
          total: 75.00
        }
      ]
    });
  })
];