import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors'

const createIntentSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  /**
   * Amount in the smallest currency unit (e.g. cents).
   * We accept integers only to avoid floating point mismatches.
   */
  amount: z.number().int().positive('Amount must be a positive integer'),
  currency: z.string().default('usd'),
  customerEmail: z.string().email().optional(),
  deliveryCity: z.string().optional(),
  deliveryAddress: z.string().optional(),
})

function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }

  return new Stripe(secret, {
    apiVersion: '2024-06-20',
  })
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const { orderId, amount, currency, customerEmail, deliveryCity, deliveryAddress } =
      createIntentSchema.parse(body)

    // Use order amount from DB when available to prevent tampering
    const order = await prisma.order
      .findUnique({
        where: { id: orderId },
        select: { id: true, total: true, customerId: true },
      })
      .catch(() => null)

    if (order) {
      const isOwner = order.customerId === session.user.id || session.user.role === 'ADMIN'
      if (!isOwner) {
        throw new UnauthorizedError('Not allowed to pay for this order')
      }
    } else {
      // In non-development environments, require an existing order
      if (process.env.NODE_ENV !== 'development') {
        throw new NotFoundError('Order')
      }
    }

    const amountFromOrder = order ? Math.round(order.total * 100) : null
    const normalizedAmount = Number.isFinite(amountFromOrder) && amountFromOrder! > 0
      ? amountFromOrder!
      : amount

    if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
      return errorResponse(new Error('Invalid payment amount'), 400)
    }

    const stripe = getStripeClient()

    const intent = await stripe.paymentIntents.create(
      {
        amount: normalizedAmount,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
        metadata: {
          orderId,
          customerId: session.user.id,
          deliveryCity: deliveryCity || '',
          deliveryAddress: deliveryAddress || '',
        },
        description: `Order ${orderId}`,
        receipt_email: customerEmail,
      },
      {
        idempotencyKey: `order-${orderId}-intent`,
      }
    )

    if (!intent.client_secret) {
      throw new Error('Failed to create payment intent')
    }

    return successResponse({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      requiresAction: intent.status === 'requires_action',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

