import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, ValidationError } from '@/root/lib/errors'

// POST /api/admin/subscriptions - Create subscription for a vendor (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (String(session.user?.role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can create subscriptions')
    }

    const body = await request.json().catch(() => ({}))
    const { userId, plan = 'STARTER', durationDays = 30 } = body || {}

    if (!userId) throw new ValidationError('userId is required')

    const validPlans = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']
    if (!validPlans.includes(String(plan).toUpperCase())) {
      throw new ValidationError('Invalid plan')
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, role: true },
    })
    if (!user) throw new ValidationError('User not found')
    if (user.role !== 'VENDOR') throw new ValidationError('User must be a vendor')

    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (existing) throw new ValidationError('Vendor already has a subscription')

    const now = new Date()
    const days = Math.max(1, Number(durationDays) || 30)
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: String(plan).toUpperCase() as any,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return successResponse({ subscription }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

// GET /api/admin/subscriptions - Get all subscriptions with stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (String(session.user?.role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access subscription data')
    }

    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscriptionPayments: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            amount: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.status === 'ACTIVE').length,
      cancelled: subscriptions.filter((s) => s.status === 'CANCELLED').length,
      expired: subscriptions.filter((s) => s.status === 'EXPIRED').length,
      trial: subscriptions.filter((s) => s.status === 'TRIAL').length,
      totalRevenue: subscriptions.reduce((sum, sub) => {
        return (
          sum +
          sub.subscriptionPayments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
        )
      }, 0),
      monthlyRecurringRevenue: subscriptions
        .filter((s) => s.status === 'ACTIVE' && s.plan !== 'STARTER')
        .reduce((sum, sub) => {
          const planPrices: Record<string, number> = {
            PROFESSIONAL: 29,
            BUSINESS: 79,
            ENTERPRISE: 199,
          }
          return sum + (planPrices[sub.plan] || 0)
        }, 0),
    }

    return successResponse({
      subscriptions,
      stats,
    })
  } catch (error) {
    console.error('[admin/subscriptions] GET error:', error)
    return errorResponse(error)
  }
}
