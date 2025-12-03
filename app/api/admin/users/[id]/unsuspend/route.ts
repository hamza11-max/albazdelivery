import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../../admin/lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '../../../../../admin/lib/audit'

// POST /api/admin/users/[id]/unsuspend - Unsuspend/activate user account
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // CSRF protection for state-changing requests
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) {
    return csrfResponse
  }

  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can perform this action')
    }

    const params = await context.params
    const { id } = params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    if (user.status === 'APPROVED') {
      return errorResponse(new Error('User is already active'), 400)
    }

    // Update user status to APPROVED (active)
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    // Log audit
    await createAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: AuditActions.USER_UNSUSPENDED,
      resource: AuditResources.USER,
      resourceId: id,
      details: {
        unsuspendedUser: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      status: 'SUCCESS',
    }, request)

    // TODO: Send notification to user about account activation

    return successResponse({
      user: updatedUser,
      message: `User ${user.name} has been activated`,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

