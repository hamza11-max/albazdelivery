import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'

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

    // Get all subscriptions with user info
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

    // Calculate statistics
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
          // Calculate monthly revenue based on plan
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
    return errorResponse(error)
  }
}

