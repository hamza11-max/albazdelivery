import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { z } from 'zod'

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Don't allow resetting admin passwords
    if (user.role === 'ADMIN' && session.user.id !== user.id) {
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

    // TODO: Send email to user with new password or reset link

    return successResponse({
      message: `Password reset successfully for ${user.name}`,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

