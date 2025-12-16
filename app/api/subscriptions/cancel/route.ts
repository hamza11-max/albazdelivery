import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import { stripe } from '@/lib/stripe'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return errorResponse(new Error('No subscription found'), 404)
    }

    // If free plan, just cancel immediately
    if (subscription.plan === 'STARTER') {
      const updated = await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      })
      return successResponse(updated)
    }

    // For paid plans, cancel at period end via Stripe
    if (!subscription.stripeSubscriptionId) {
      return errorResponse(new Error('No active Stripe subscription'), 400)
    }

    try {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })

      const updated = await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          cancelAtPeriodEnd: true,
          cancelledAt: new Date(),
        },
      })

      return successResponse(updated)
    } catch (stripeError: any) {
      console.error('[Cancel Subscription] Stripe error:', stripeError)
      return errorResponse(new Error('Failed to cancel subscription'), 500)
    }
  } catch (error) {
    return errorResponse(error)
  }
}

