import { getSessionFromRequest } from "./get-session-from-request"
import { prisma } from "./prisma"
import { stripe, PLAN_PRICES } from "./stripe"
import { errorResponse, ForbiddenError, successResponse, UnauthorizedError } from "./errors"
import { resolveVendorEntitlements } from "./subscriptions/resolve-entitlements"
import { VENDOR_FREE_TRIAL_DAYS } from "./subscription-plans"
import type { Prisma } from "../generated/prisma/client"

const PAID_PLANS = ["PROFESSIONAL", "BUSINESS", "ENTERPRISE"] as const

const SUBSCRIPTION_FIND_INCLUDE = {
  subscriptionPayments: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
  },
  usage: true,
} as const satisfies Prisma.SubscriptionInclude

function starterActivePeriodEnd(): Date {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
}

function vendorTrialDurationDays(): number {
  const raw = String(process.env.VENDOR_TRIAL_DAYS ?? "").trim()
  const n = parseInt(raw, 10)
  if (Number.isFinite(n) && n > 0 && n <= 366) return n
  return VENDOR_FREE_TRIAL_DAYS
}

function trialEligibilityReason(
  sub: {
    trialStart: Date | null
    status: string
    plan: string
    trialEnd: Date | null
  } | null,
  now: number
): string | null {
  if (!sub) return null
  if (sub.trialStart != null) return "trial_already_used"
  if (sub.status === "ACTIVE" && sub.plan !== "STARTER") return "already_on_paid_plan"
  if (sub.status === "TRIAL" && sub.trialEnd != null && sub.trialEnd.getTime() > now) {
    return "trial_already_active"
  }
  return null
}

async function expireStaleTrialSubscription(
  sub: NonNullable<Awaited<ReturnType<typeof prisma.subscription.findUnique>>>
) {
  if (sub.status !== "TRIAL" || !sub.trialEnd || sub.trialEnd.getTime() >= Date.now()) {
    return sub
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      plan: "STARTER",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: starterActivePeriodEnd(),
      cancelAtPeriodEnd: false,
    },
  })

  const refreshed = await prisma.subscription.findUnique({
    where: { id: sub.id },
    include: SUBSCRIPTION_FIND_INCLUDE,
  })
  return refreshed ?? sub
}

/** When true, POST plan STARTER can activate without Stripe (intended for dev/special enterprise deals). */
function allowStarterPlanWithoutStripe(): boolean {
  if (process.env.NODE_ENV === "development") return true
  const v = String(process.env.ALLOW_STARTER_PLAN_WITHOUT_STRIPE || "").trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes"
}

export async function handleSubscriptionsGet(request: Request) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: SUBSCRIPTION_FIND_INCLUDE,
    })

    if (!subscription) {
      // Do not auto-provision a subscription on read (entitlement + billing abuse). Clients must
      // start a trial or checkout via POST /api/subscriptions (or a dedicated onboarding flow).
      return successResponse({ subscription: null, entitlements: null })
    }

    subscription = await expireStaleTrialSubscription(subscription)

    const entitlements = resolveVendorEntitlements({
      plan: subscription.plan,
      status: subscription.status,
      featureOverrides: subscription.featureOverrides,
    })

    return successResponse({ subscription, entitlements })
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

    const body = (await request.json().catch(() => ({}))) as {
      plan?: string
      paymentMethodId?: string
      startTrial?: boolean
    }
    const { paymentMethodId } = body
    const startTrial = body.startTrial === true

    let plan = body.plan
    const VALID = ["STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE"] as const

    if (startTrial) {
      const trialPlan =
        plan &&
        VALID.includes(plan as (typeof VALID)[number]) &&
        plan !== "STARTER" &&
        PAID_PLANS.includes(plan as (typeof PAID_PLANS)[number])
          ? plan
          : "PROFESSIONAL"

      let row = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        include: SUBSCRIPTION_FIND_INCLUDE,
      })
      if (row) {
        row = await expireStaleTrialSubscription(row)
      }

      const existingForTrial =
        row != null
          ? {
              trialStart: row.trialStart,
              trialEnd: row.trialEnd,
              status: row.status,
              plan: row.plan,
            }
          : null

      const now = Date.now()
      const deny = trialEligibilityReason(existingForTrial, now)
      if (deny) {
        const msg =
          deny === "trial_already_used"
            ? "Free trial has already been used for this account"
            : deny === "already_on_paid_plan"
              ? "You already have an active paid subscription"
              : "A trial is already active"
        return errorResponse(new ForbiddenError(msg))
      }

      const days = vendorTrialDurationDays()
      const trialEnd = new Date(now + days * 24 * 60 * 60 * 1000)
      const trialStart = new Date(now)

      const updated = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: {
          plan: trialPlan,
          status: "TRIAL",
          trialStart,
          trialEnd,
          currentPeriodStart: trialStart,
          currentPeriodEnd: trialEnd,
          cancelAtPeriodEnd: false,
        },
        create: {
          userId: session.user.id,
          plan: trialPlan,
          status: "TRIAL",
          trialStart,
          trialEnd,
          currentPeriodStart: trialStart,
          currentPeriodEnd: trialEnd,
        },
        include: SUBSCRIPTION_FIND_INCLUDE,
      })

      return successResponse({ subscription: updated })
    }

    if (!plan || !VALID.includes(plan as (typeof VALID)[number])) {
      return errorResponse(new Error("Invalid plan"), 400)
    }

    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (plan === "STARTER") {
      if (!allowStarterPlanWithoutStripe()) {
        return errorResponse(
          new ForbiddenError(
            "STARTER plan is not self-serve in this environment. Set ALLOW_STARTER_PLAN_WITHOUT_STRIPE=1 if intended, or choose a plan billed via Stripe."
          )
        )
      }
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
      return successResponse({ subscription: updated })
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

        return successResponse({ subscription: updated })
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
      if (subscription.status === "TRIAL") {
        const updated = await prisma.subscription.update({
          where: { userId: session.user.id },
          data: {
            plan: "STARTER",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: starterActivePeriodEnd(),
            cancelAtPeriodEnd: false,
          },
        })
        return successResponse(updated)
      }
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
