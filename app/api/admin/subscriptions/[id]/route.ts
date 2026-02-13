import { NextRequest } from 'next/server'
import { auth } from '@/root/lib/auth'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'

// PATCH /api/admin/subscriptions/[id] - Extend or update subscription (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (String(session.user?.role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can update subscriptions')
    }

    const id = params.id
    if (!id) return errorResponse(new Error('Subscription ID required'), 400)

    const body = await request.json().catch(() => ({}))
    const { extendDays, plan, status } = body || {}

    const existing = await prisma.subscription.findUnique({
      where: { id },
      select: { id: true, currentPeriodEnd: true, plan: true, status: true },
    })
    if (!existing) throw new NotFoundError('Subscription')

    const updates: { currentPeriodEnd?: Date; plan?: string; status?: string } = {}

    if (typeof extendDays === 'number' && extendDays > 0) {
      const from = new Date(existing.currentPeriodEnd).getTime() > Date.now()
        ? new Date(existing.currentPeriodEnd)
        : new Date()
      updates.currentPeriodEnd = new Date(from.getTime() + extendDays * 24 * 60 * 60 * 1000)
    }

    if (plan && ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'].includes(String(plan).toUpperCase())) {
      updates.plan = String(plan).toUpperCase()
    }

    if (status && ['ACTIVE', 'TRIAL', 'CANCELLED', 'EXPIRED', 'PAST_DUE'].includes(String(status).toUpperCase())) {
      updates.status = String(status).toUpperCase()
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(new Error('No valid updates (extendDays, plan, or status required)'), 400)
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updates,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return successResponse({ subscription: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
