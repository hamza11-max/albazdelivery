"use client"

import { Elements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe-client"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
}