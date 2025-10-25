/**
 * @jest-environment jsdom
 */
import { test, describe, expect } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { CheckoutPage } from '@/app/checkout/client';

// Mock global fetch
global.fetch = jest.fn();

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
  test('completes card payment successfully', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      mockFetchResponse({
        success: true,
        clientSecret: 'pi_test_secret_key',
      })
    );

    render(
      <SessionProvider session={mockSession}>
        <CheckoutPage order={mockOrder} />
      </SessionProvider>
    );

    // Wait for payment form to load
    const cardInput = await screen.findByTestId('card-number-input');
    expect(cardInput).toBeInTheDocument();

    // Fill in payment details
    await userEvent.type(cardInput, '4242424242424242');
    await userEvent.type(screen.getByTestId('card-expiry-input'), '12/25');
    await userEvent.type(screen.getByTestId('card-cvc-input'), '123');

    // Submit payment
    const submitButton = screen.getByRole('button', { name: /pay/i });
    await userEvent.click(submitButton);

    // Verify success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByTestId('success-message')).toHaveTextContent(/payment successful/i);
    });
  });

  test('handles payment failure gracefully', async () => {
    // Mock failed payment
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Payment failed'
        })
      })
    );

    render(
      <SessionProvider session={mockSession}>
        <CheckoutPage order={mockOrder} />
      </SessionProvider>
    );

    // Fill in payment details
    const cardInput = await screen.findByTestId('card-number-input');
    await userEvent.type(cardInput, '4000000000000002'); // Declined card
    await userEvent.type(screen.getByTestId('card-expiry-input'), '12/25');
    await userEvent.type(screen.getByTestId('card-cvc-input'), '123');

    // Submit payment
    const submitButton = screen.getByRole('button', { name: /pay/i });
    await userEvent.click(submitButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(/payment failed/i);
    });
  });

  test('validates payment form inputs', async () => {
    render(
      <SessionProvider session={mockSession}>
        <CheckoutPage order={mockOrder} />
      </SessionProvider>
    );

    // Wait for form to load
    const submitButton = await screen.findByRole('button', { name: /pay/i });

    // Try to submit without filling in details
    await userEvent.click(submitButton);

    // Check for required fields
    await waitFor(() => {
      expect(screen.getByTestId('card-number-input')).toBeRequired();
      expect(screen.getByTestId('card-expiry-input')).toBeRequired();
      expect(screen.getByTestId('card-cvc-input')).toBeRequired();
    });
  });
});