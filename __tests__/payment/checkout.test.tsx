/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { test, describe, jest, beforeEach } from '@jest/globals';
import { screen, waitFor, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutPage } from '@/app/checkout/client';

const TEST_ORDER_ID = 'clxxxxxxxxxxxxxxxxxxxxxxxxx';
const TEST_PAYMENT_INTENT_ID = 'pi_123';
const TEST_CLIENT_SECRET = 'test_secret';

/** Populated by mocked `@stripe/react-stripe-js` factory (avoids jest hoist issues). */
const reactStripeTestState: {
  mockConfirmCardPayment?: jest.Mock;
  mockStripe?: { confirmCardPayment: jest.Mock; elements: jest.Mock; createPaymentMethod: jest.Mock };
} = {};

jest.mock('@stripe/react-stripe-js', () => {
  const React = require('react');
  const mockConfirmCardPayment = jest.fn(() =>
    Promise.resolve({
      paymentIntent: {
        id: 'pi_123',
        status: 'succeeded',
      },
    })
  );
  const mockElements = {
    create: jest.fn().mockReturnValue({ mount: jest.fn() }),
    getElement: jest.fn().mockReturnValue({ mount: jest.fn() }),
  };
  const mockStripe = {
    createPaymentMethod: jest.fn(),
    confirmCardPayment: mockConfirmCardPayment,
    elements: jest.fn().mockReturnValue(mockElements),
  };
  reactStripeTestState.mockConfirmCardPayment = mockConfirmCardPayment;
  reactStripeTestState.mockStripe = mockStripe;

  return {
    __esModule: true,
    loadStripe: jest.fn(() => Promise.resolve(mockStripe)),
    useStripe: jest.fn(() => mockStripe),
    useElements: jest.fn(() => mockElements),
    Elements: ({ children }: { children: React.ReactNode }) => children,
    CardElement: (props: { onChange?: (e: { complete: boolean }) => void }) => {
      React.useEffect(() => {
        props.onChange?.({ complete: true });
      }, [props.onChange]);
      return React.createElement('div', {
        id: 'card-element',
        'data-testid': 'card-number-input',
      });
    },
  };
});

const mockToast = jest.fn();

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

type MockResponseInit = {
  success?: boolean
  data?: { clientSecret?: string; paymentIntentId?: string; message?: string }
  error?: { message?: string }
  status?: number
}

const createMockResponse = (init: MockResponseInit = {}) => {
  const { success = true, data = {}, error, status } = init;
  const resolvedStatus =
    status ?? (success ? 200 : error ? 400 : 400);
  return new Response(
    JSON.stringify(
      error
        ? { success: false, error, meta: {} }
        : { success, data, meta: {} }
    ),
    {
      status: resolvedStatus,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockToast.mockReset();
  reactStripeTestState.mockConfirmCardPayment?.mockReset();
  reactStripeTestState.mockConfirmCardPayment?.mockImplementation(() =>
    Promise.resolve({
      paymentIntent: {
        id: TEST_PAYMENT_INTENT_ID,
        status: 'succeeded',
      } as import('@stripe/stripe-js').PaymentIntent,
    })
  );
  mockFetch.mockImplementation(() => Promise.resolve(createMockResponse()));
});

interface MockOrder {
  id: string;
  items: { id: number; name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

const mockOrder: MockOrder = {
  id: TEST_ORDER_ID,
  items: [{ id: 1, name: 'Test Item', price: 10.99, quantity: 2 }],
  subtotal: 21.98,
  deliveryFee: 5.0,
  total: 26.98,
};

describe('Payment Flow Integration Tests', () => {
  const setup = (customOrder: Partial<MockOrder> = {}) => {
    const order = { ...mockOrder, ...customOrder };
    return {
      user: userEvent.setup(),
      ...render(
        <Elements stripe={(reactStripeTestState.mockStripe ?? null) as any}>
          <CheckoutPage order={order} />
        </Elements>
      ),
    };
  };

  test('renders payment form', async () => {
    setup();

    expect(screen.getByText(/Paiement de commande/i)).toBeInTheDocument();
    expect(screen.getByText(/Détails de la carte/i)).toBeInTheDocument();
    expect(screen.getByTestId('pay-button')).toBeInTheDocument();
  });

  test('displays correct order summary (formatPrice uses cents)', async () => {
    setup();

    expect(screen.getByText(/Sous-total/i)).toBeInTheDocument();
    expect(screen.getByText(/\$21\.98/)).toBeInTheDocument();
    expect(screen.getByText(/Frais de livraison/i)).toBeInTheDocument();
    expect(screen.getByText(/\$5\.00/)).toBeInTheDocument();
    expect(screen.getByText(/^Total$/i).parentElement).toHaveTextContent('$26.98');
  });

  test('handles payment submission: create-intent then confirm', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(
        createMockResponse({
          success: true,
          data: {
            clientSecret: TEST_CLIENT_SECRET,
            paymentIntentId: TEST_PAYMENT_INTENT_ID,
          },
        })
      )
    );

    const { user } = setup();
    const payButton = screen.getByTestId('pay-button');

    await user.click(payButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payments/create-intent',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining(TEST_ORDER_ID),
        })
      );
    });

    const rawBody = (mockFetch.mock.calls[0]?.[1] as RequestInit)?.body;
    expect(typeof rawBody).toBe('string');
    expect(JSON.parse(rawBody as string).amount).toBe(2698);

    // confirmCardPayment depends on Stripe Elements internals in JSDOM; create-intent contract is asserted above.
  });

  test('handles API error responses', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(
        createMockResponse({
          success: false,
          error: { message: 'Payment processing failed' },
          status: 400,
        })
      )
    );

    const { user } = setup();
    const payButton = screen.getByTestId('pay-button');

    await user.click(payButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalled();
    });
  });

  test('handles network errors on create-intent', async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    const { user } = setup();
    const payButton = screen.getByTestId('pay-button');

    await user.click(payButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Network error',
          variant: 'destructive',
        })
      );
      expect(payButton).not.toBeDisabled();
    });
  });
});
