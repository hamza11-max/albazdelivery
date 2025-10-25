/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { test, describe, jest } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { Elements } from '@stripe/stripe-js';
import { CheckoutPage } from '@/app/checkout/client';

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  ...jest.requireActual('@stripe/stripe-js'),
  useStripe: () => ({
    confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }),
  }),
  useElements: () => ({
    getElement: jest.fn().mockReturnValue({ something: true }),
  }),
  Elements: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock global fetch
global.fetch = jest.fn();

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
const mockFetchResponse = (response: any) => {
  return {
    ok: response.success ?? true,
    status: response.success ? 200 : 400,
    json: () => Promise.resolve(response),
  };
};

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

const mockOrder = {
  id: 'test_order_123',
  items: [
    { id: 1, name: 'Test Item', price: 10.99, quantity: 2 }
  ],
  subtotal: 21.98,
  deliveryFee: 5.00,
  total: 26.98
};

describe('Payment Flow Integration Tests', () => {
  const setup = () => {
    return render(
      <SessionProvider session={mockSession}>
        <Elements stripe={null}>
          <CheckoutPage order={mockOrder} />
        </Elements>
      </SessionProvider>
    );
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

  test('handles payment submission', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ clientSecret: 'test_secret' }),
      })
    );

    setup();

    // Trigger payment
    const payButton = screen.getByTestId('pay-button');
    await userEvent.click(payButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/payments/create-intent',
        expect.any(Object)
      );
    });
  });

  test('handles payment failure', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    setup();

    // Trigger payment
    const payButton = screen.getByTestId('pay-button');
    await userEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeInTheDocument();
    });
  });
});