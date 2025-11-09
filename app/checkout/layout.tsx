'use client';

import React from 'react';

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <div className="checkout-layout">
      {children}
    </div>
  );
}
