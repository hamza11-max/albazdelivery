import { getStripe } from '@/lib/stripe'

export async function stripeRefundForPaymentIntent(params: {
  paymentIntentId: string
  amountMajorUnits: number
  idempotencyKey: string
}) {
  const stripe = getStripe()
  const amountCents = Math.round(params.amountMajorUnits * 100)
  if (amountCents <= 0) {
    throw new Error('Refund amount must be positive')
  }

  return stripe.refunds.create(
    {
      payment_intent: params.paymentIntentId,
      amount: amountCents,
    },
    { idempotencyKey: params.idempotencyKey }
  )
}
