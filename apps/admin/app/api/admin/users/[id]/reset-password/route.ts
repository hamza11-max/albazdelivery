import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { hashPassword } from '@/root/lib/password'
import { csrfProtection } from '../../../../../../lib/csrf'
import { notifyUserPasswordResetByAdmin } from '@/root/lib/mail/adminUserNotifications'
import { notificationEmailStatus } from '@/root/lib/mail/sendTransactionalEmail'
import { z } from 'zod'
import { isFullAdmin, isSuperAdmin, isProtectedAdminAccount } from '@/root/lib/admin-roles'

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) {
    return csrfResponse
  }

  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (!isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins can perform this action')
    }

    const params = await context.params
    const { id } = params
    const body = await request.json()

    // Validation
    const schema = z.object({
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    })

    const { newPassword } = schema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    if (
      isProtectedAdminAccount(user.role) &&
      session.user.id !== user.id &&
      !isSuperAdmin(session.user.role)
    ) {
      throw new ForbiddenError('Cannot reset other admin passwords')
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    })

    const mailResult = await notifyUserPasswordResetByAdmin({
      to: user.email,
      name: user.name,
    })
    if (mailResult.ok === false) {
      console.error('[admin/reset-password] notification email failed', mailResult.error)
    }

    return successResponse({
      message: `Password reset successfully for ${user.name}`,
      notificationEmail: notificationEmailStatus(mailResult),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

