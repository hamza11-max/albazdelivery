import { getSessionFromRequest } from "./get-session-from-request"
import { prisma } from "./prisma"
import { stripe, PLAN_PRICES } from "./stripe"
import { successResponse, errorResponse, UnauthorizedError } from "./errors"

export async function handleSubscriptionsGet(request: Request) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: {
        subscriptionPayments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        usage: true,
      },
    })

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          plan: "STARTER",
          status: "TRIAL",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

export async function handleSubscriptionsPost(request: Request) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const { plan, paymentMethodId } = body

    if (!plan || !["STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE"].includes(plan)) {
      return errorResponse(new Error("Invalid plan"), 400)
    }

    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (plan === "STARTER") {
      const updated = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: {
          plan: "STARTER",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        create: {
          userId: session.user.id,
          plan: "STARTER",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })
      return successResponse(updated)
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return errorResponse(new Error("Stripe is not configured"), 500)
    }

    let stripeCustomerId = subscription?.stripeCustomerId

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
    if (!priceId || priceId === "0") {
      return errorResponse(new Error("Invalid plan price"), 400)
    }

    if (subscription?.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)

        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: priceId,
            },
          ],
          proration_behavior: "always_invoice",
        })

        const updated = await prisma.subscription.update({
          where: { userId: session.user.id },
          data: {
            plan,
            status: "ACTIVE",
          },
        })

        return successResponse(updated)
      } catch (error) {
        console.warn("Stripe subscription not found, creating new one:", error)
      }
    }

    const subscriptionData: Record<string, unknown> = {
      customer: stripeCustomerId,
      items: [{ price: priceId }],
    }

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId
      subscriptionData.payment_behavior = "default_incomplete"
      subscriptionData.payment_settings = { save_default_payment_method: "on_subscription" }
    }

    const stripeSubscription = await stripe.subscriptions.create(subscriptionData as any)

    const updated = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan,
        status: stripeSubscription.status === "active" ? "ACTIVE" : "TRIAL",
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      create: {
        userId: session.user.id,
        plan,
        status: stripeSubscription.status === "active" ? "ACTIVE" : "TRIAL",
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    })

    const response: { subscription: typeof updated; clientSecret?: string | null } = {
      subscription: updated,
    }

    if (stripeSubscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice as string)
      if (invoice.payment_intent && typeof invoice.payment_intent === "string") {
        const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent)
        response.clientSecret = paymentIntent.client_secret
      }
    }

    return successResponse(response)
  } catch (error) {
    console.error("[Subscription API] Error:", error)
    return errorResponse(error)
  }
}

export async function handleSubscriptionsCancelPost(request: Request) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return errorResponse(new Error("No subscription found"), 404)
    }

    if (subscription.plan === "STARTER") {
      const updated = await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      })
      return successResponse(updated)
    }

    if (!subscription.stripeSubscriptionId) {
      return errorResponse(new Error("No active Stripe subscription"), 400)
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
    } catch (stripeError: unknown) {
      console.error("[Cancel Subscription] Stripe error:", stripeError)
      return errorResponse(new Error("Failed to cancel subscription"), 500)
    }
  } catch (error) {
    return errorResponse(error)
  }
}
