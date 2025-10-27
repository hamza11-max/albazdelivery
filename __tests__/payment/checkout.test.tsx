/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { test, describe, jest, beforeEach } from '@jest/globals';
import { screen, waitFor, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutPage } from '@/app/checkout/client';

// Test constants
const TEST_ORDER_ID = 'test_order_123';
const TEST_PAYMENT_INTENT_ID = 'pi_123';
const TEST_CLIENT_SECRET = 'test_secret';
const TEST_USER_ID = 'test_user';

// Define payment intent types for mocking
type PaymentIntentStatus = 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'canceled';

interface MockPaymentIntent {
  id: string;
  status: PaymentIntentStatus;
}

interface MockConfirmCardPaymentResult {
  paymentIntent: MockPaymentIntent;
}

// Mock Stripe with proper types
jest.mock('@stripe/stripe-js', () => {
  const mockConfirmCardPayment = jest.fn()
    .mockImplementation((): Promise<MockConfirmCardPaymentResult> => 
      Promise.resolve({
        paymentIntent: {
          id: 'pi_123',
          status: 'succeeded'
        }
      })
    );

  return {
    loadStripe: () => Promise.resolve({
      createPaymentMethod: jest.fn(),
      confirmCardPayment: mockConfirmCardPayment,
    }),
    useStripe: () => ({
      confirmCardPayment: mockConfirmCardPayment,
    }),
    useElements: () => ({
      getElement: jest.fn().mockReturnValue({ complete: true }),
    }),
    Elements: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Create mock session
const mockSession: Session = {
  user: { 
    id: 'test_user', 
    name: 'Test User', 
    email: 'test@test.com',
    role: 'customer',
  },
  expires: new Date(Date.now() + 2 * 86400).toISOString()
};

// Mock fetch responses
type MockResponseInit = {
  success?: boolean;
  data?: any;
  status?: number;
};

const createMockResponse = (init: MockResponseInit = {}) => {
  const { success = true, data = {}, status = success ? 200 : 400 } = init;
  return new Response(JSON.stringify({ success, data }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Setup fetch mock
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    return Promise.resolve(createMockResponse());
  });
});

// Test data
interface MockOrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface MockOrder {
  id: string;
  items: MockOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

const mockOrder: MockOrder = {
  id: TEST_ORDER_ID,
  items: [
    { id: 1, name: 'Test Item', price: 10.99, quantity: 2 }
  ],
  subtotal: 21.98,
  deliveryFee: 5.00,
  total: 26.98
};

describe('Payment Flow Integration Tests', () => {
  const setup = (customOrder: Partial<MockOrder> = {}) => {
    const order = { ...mockOrder, ...customOrder };
    return {
      user: userEvent.setup(),
      ...render(
        <SessionProvider session={mockSession}>
          <Elements stripe={null}>
            <CheckoutPage order={order} />
          </Elements>
        </SessionProvider>
      )
    };
  };

  test('renders payment form', async () => {
    setup();
    
    expect(screen.getByText(/Paiement de commande/i)).toBeInTheDocument();
    expect(screen.getByText(/Détails de la carte/i)).toBeInTheDocument();
    expect(screen.getByTestId('pay-button')).toBeInTheDocument();
  });

  test('displays correct order summary', async () => {
    setup();

    expect(screen.getByText(/Sous-total/i)).toBeInTheDocument();
    expect(screen.getByText(/21.98/)).toBeInTheDocument();
    expect(screen.getByText(/Frais de livraison/i)).toBeInTheDocument();
    expect(screen.getByText(/5.00/)).toBeInTheDocument();
    expect(screen.getByText(/26.98/)).toBeInTheDocument();
  });

  test('handles payment submission successfully', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve(createMockResponse({
        success: true,
        data: { 
          clientSecret: TEST_CLIENT_SECRET,
          paymentIntentId: TEST_PAYMENT_INTENT_ID
        }
      }))
    );

    const { user } = setup();
    const payButton = screen.getByTestId('pay-button');
    
    await user.click(payButton);

    await waitFor(() => {
      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payments/create-intent',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(TEST_ORDER_ID)
        })
      );

      // Verify loading state is handled
      expect(payButton).toBeDisabled();
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  test('handles payment failures appropriately', async () => {
    const errorMessage = 'Payment processing failed';
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve(createMockResponse({
        success: false,
        data: { message: errorMessage },
        status: 400
      }))
    );

    const { user } = setup();
    const payButton = screen.getByTestId('pay-button');
    
    await user.click(payButton);

    await waitFor(() => {
      // Verify error state
      expect(screen.getByText(/erreur/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      // Verify button is re-enabled
      expect(payButton).not.toBeDisabled();
      
      // Verify API was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  test('handles network errors gracefully', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );

    const { user } = setup();
    const payButton = screen.getByTestId('pay-button');
    
    await user.click(payButton);

    await waitFor(() => {
      expect(screen.getByText(/erreur de réseau/i)).toBeInTheDocument();
      expect(payButton).not.toBeDisabled();
    });
  });
});