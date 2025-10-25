"use client";

interface CheckoutOrder {
  id: string;
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

interface CheckoutPageProps {
  order: CheckoutOrder;
}

export function CheckoutPage({ order }: CheckoutPageProps) {
  return (
    <div>
      <h1>Checkout</h1>
    </div>
  );
}