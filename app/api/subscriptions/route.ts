import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import { stripe, PLAN_PRICES } from '@/lib/stripe'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'

// GET /api/subscriptions - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: {
        subscriptionPayments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        usage: true,
      },
    })

    if (!subscription) {
      // Create default starter subscription
      subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          plan: 'STARTER',
          status: 'TRIAL',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          trialStart: new Date(),
          trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        include: {
          subscriptionPayments: true,
          usage: true,
        },
      })
    }

    return successResponse(subscription)
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/subscriptions - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const { plan, paymentMethodId } = body

    if (!plan || !['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'].includes(plan)) {
      return errorResponse(new Error('Invalid plan'), 400)
    }

    // Get or create subscription
    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    // Handle free plan
    if (plan === 'STARTER') {
      const updated = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: {
          plan: 'STARTER',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        create: {
          userId: session.user.id,
          plan: 'STARTER',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })
      return successResponse(updated)
    }

    // For paid plans, we need Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return errorResponse(new Error('Stripe is not configured'), 500)
    }

    let stripeCustomerId = subscription?.stripeCustomerId

    // Get or create Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          userId: session.user.id,
        },
      })
      stripeCustomerId = customer.id
    }

    const priceId = PLAN_PRICES[plan]
    if (!priceId || priceId === '0') {
      return errorResponse(new Error('Invalid plan price'), 400)
    }

    // If subscription exists and has Stripe subscription, update it
    if (subscription?.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)
        
        // Update subscription
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'always_invoice',
        })

        const updated = await prisma.subscription.update({
          where: { userId: session.user.id },
          data: {
            plan,
            status: 'ACTIVE',
          },
        })

        return successResponse(updated)
      } catch (error) {
        // If subscription doesn't exist in Stripe, create new one
        console.warn('Stripe subscription not found, creating new one:', error)
      }
    }

    // Create new Stripe subscription
    const subscriptionData: any = {
      customer: stripeCustomerId,
      items: [{ price: priceId }],
    }

    // If payment method provided, use it
    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId
      subscriptionData.payment_behavior = 'default_incomplete'
      subscriptionData.payment_settings = { save_default_payment_method: 'on_subscription' }
    }

    const stripeSubscription = await stripe.subscriptions.create(subscriptionData)

    // Update database
    const updated = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan,
        status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'TRIAL',
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      create: {
        userId: session.user.id,
        plan,
        status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'TRIAL',
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    })

    const response: any = { subscription: updated }

    // If payment is required, return client secret
    if (stripeSubscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice as string)
      if (invoice.payment_intent && typeof invoice.payment_intent === 'string') {
        const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent)
        response.clientSecret = paymentIntent.client_secret
      }
    }

    return successResponse(response)
  } catch (error) {
    console.error('[Subscription API] Error:', error)
    return errorResponse(error)
  }
}

