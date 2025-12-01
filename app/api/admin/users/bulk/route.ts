import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../admin/lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '../../../../admin/lib/audit'
import { z } from 'zod'

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
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'ADMIN') {
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

    // Don't allow modifying admins
    const adminUsers = users.filter((u) => u.role === 'ADMIN')
    if (adminUsers.length > 0) {
      return errorResponse(new Error('Cannot modify admin accounts'), 400)
    }

    let result: any = { affected: 0 }

    if (action === 'suspend') {
      result = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          role: { not: 'ADMIN' },
        },
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
        where: {
          id: { in: userIds },
          role: { not: 'ADMIN' },
        },
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
      result = await prisma.$transaction(async (tx: any) => {
        let deletedCount = 0

        for (const userId of userIds) {
          const user = await tx.user.findUnique({ where: { id: userId } })
          if (!user || user.role === 'ADMIN') continue

          // Delete related records
          if (user.role === 'VENDOR') {
            await tx.store.deleteMany({ where: { vendorId: userId } })
            await tx.product.deleteMany({ where: { vendorId: userId } })
          }

          if (user.role === 'DRIVER') {
            await tx.driverLocation.deleteMany({ where: { driverId: userId } })
            await tx.driverPerformance.deleteMany({ where: { driverId: userId } })
          }

          if (user.role === 'CUSTOMER') {
            await tx.loyaltyAccount.deleteMany({ where: { customerId: userId } })
            await tx.wallet.deleteMany({ where: { customerId: userId } })
          }

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

