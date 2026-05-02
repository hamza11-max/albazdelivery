import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '@/lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'
import { deleteUserRelatedData } from '@/root/lib/admin/cascade-delete-user'
import { z } from 'zod'
import { isFullAdmin, isSuperAdmin, isProtectedAdminAccount } from '@/root/lib/admin-roles'

const bulkActionSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  action: z.enum(['suspend', 'delete', 'unsuspend']),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // CSRF protection for state-changing requests
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
      throw new ForbiddenError('Only admins can perform bulk actions')
    }

    const body = await request.json()
    const { userIds, action, reason } = bulkActionSchema.parse(body)

    // Get users to verify they exist and can be modified
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    })

    if (users.length !== userIds.length) {
      return errorResponse(new Error('Some users were not found'), 404)
    }

    const sessionIsSuper = isSuperAdmin(session.user.role)

    if (userIds.includes(session.user.id)) {
      return errorResponse(new Error('Cannot bulk modify your own account'), 400)
    }

    const protectedTargets = users.filter((u) => isProtectedAdminAccount(u.role))
    if (protectedTargets.length > 0 && !sessionIsSuper) {
      return errorResponse(new Error('Cannot modify admin accounts'), 400)
    }

    let result: any = { affected: 0 }

    const staffRoleFilter =
      sessionIsSuper
        ? undefined
        : { notIn: ['ADMIN', 'SUPER_ADMIN'] as const }

    if (action === 'suspend') {
      result = await prisma.user.updateMany({
        where: staffRoleFilter
          ? { id: { in: userIds }, role: staffRoleFilter }
          : { id: { in: userIds } },
        data: {
          status: 'REJECTED',
        },
      })

      // Log audit
      await createAuditLog({
        userId: session.user.id,
        userRole: session.user.role,
        action: AuditActions.BULK_USER_SUSPENDED,
        resource: AuditResources.USER,
        details: {
          userIds,
          count: result.count,
          reason,
        },
        status: 'SUCCESS',
      }, request)
    } else if (action === 'unsuspend') {
      result = await prisma.user.updateMany({
        where: staffRoleFilter
          ? { id: { in: userIds }, role: staffRoleFilter }
          : { id: { in: userIds } },
        data: {
          status: 'APPROVED',
        },
      })

      // Log audit
      await createAuditLog({
        userId: session.user.id,
        userRole: session.user.role,
        action: AuditActions.BULK_USER_UNSUSPENDED,
        resource: AuditResources.USER,
        details: {
          userIds,
          count: result.count,
        },
        status: 'SUCCESS',
      }, request)
    } else if (action === 'delete') {
      // Delete users and related data in transaction
      result = await prisma.$transaction(async (tx) => {
        let deletedCount = 0

        for (const userId of userIds) {
          const u = await tx.user.findUnique({ where: { id: userId } })
          if (!u) continue
          if (u.id === session.user.id) continue
          if (isProtectedAdminAccount(u.role) && !sessionIsSuper) continue

          await deleteUserRelatedData(tx, userId)
          await tx.user.delete({ where: { id: userId } })
          deletedCount++
        }

        return { count: deletedCount }
      })

      // Log audit
      await createAuditLog({
        userId: session.user.id,
        userRole: session.user.role,
        action: AuditActions.BULK_USER_DELETED,
        resource: AuditResources.USER,
        details: {
          userIds,
          count: result.count,
          reason,
        },
        status: 'SUCCESS',
      }, request)
    }

    return successResponse({
      message: `Bulk ${action} completed`,
      affected: result.count || result.affected || 0,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

