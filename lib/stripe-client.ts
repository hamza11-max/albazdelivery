'use client'

import { loadStripe } from '@stripe/stripe-js'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

export const stripePromise =
  typeof publishableKey === 'string' && publishableKey.length > 0
    ? loadStripe(publishableKey)
    : null
