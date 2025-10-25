export const dynamic = 'force-dynamic';

import { CheckoutPage } from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order',
};

export default async function Page({ params, searchParams }: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Here you would normally fetch the order from your API or database
  // For now we'll pass a placeholder order that matches the test
  const order = {
    id: searchParams.orderId as string || 'test_order_123',
    items: [
      { id: 1, name: 'Test Item', price: 10.99, quantity: 2 }
    ],
    subtotal: 21.98,
    deliveryFee: 5.00,
    total: 26.98
  };

  return <CheckoutPage order={order} />;
}