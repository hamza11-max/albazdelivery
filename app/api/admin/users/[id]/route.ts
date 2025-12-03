import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { hashPassword } from '@/root/lib/password'
import { createAuditLog, AuditActions, AuditResources } from '../../../../admin/lib/audit'
import { csrfProtection } from '../../../../admin/lib/csrf'
import { z } from 'zod'

// GET /api/admin/users/[id] - Get specific user details
export async function GET(
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
      throw new ForbiddenError('Only admins can access this resource')
    }

    const params = await context.params
    const { id } = params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stores: true,
        _count: {
          select: {
            orders: true,
            driverDeliveries: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return successResponse({ user: userWithoutPassword })
  } catch (error) {
    return errorResponse(error)
  }
}

// PUT /api/admin/users/[id] - Update user information
export async function PUT(
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
    const body = await request.json()

    // Validation schema
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.enum(['CUSTOMER', 'VENDOR', 'DRIVER', 'ADMIN']).optional(),
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      address: z.string().optional(),
      city: z.string().optional(),
    })

    const validatedData = updateSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Don't allow modifying super admins
    if (user.role === 'ADMIN' && session.user.id !== user.id) {
      throw new ForbiddenError('Cannot modify other admin accounts')
    }

    // Normalize email and phone if provided
    const updateData: any = { ...validatedData }
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim()
    }
    if (updateData.phone) {
      updateData.phone = updateData.phone.trim()
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        address: true,
        city: true,
        updatedAt: true,
      },
    })

    // Log audit
    await createAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: AuditActions.USER_UPDATED,
      resource: AuditResources.USER,
      resourceId: id,
      details: {
        changes: updateData,
        previous: {
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      status: 'SUCCESS',
    }, request)

    return successResponse({
      user: updatedUser,
      message: 'User updated successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/admin/users/[id] - Delete user account
export async function DELETE(
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

    // Don't allow deleting admins or self
    if (user.role === 'ADMIN') {
      throw new ForbiddenError('Cannot delete admin accounts')
    }

    if (user.id === session.user.id) {
      throw new ForbiddenError('Cannot delete your own account')
    }

    // Delete user and related data
    await prisma.$transaction(async (tx: any) => {
      // Delete related records first
      if (user.role === 'VENDOR') {
        await tx.store.deleteMany({ where: { vendorId: id } })
        await tx.product.deleteMany({ where: { vendorId: id } })
      }
      
      if (user.role === 'DRIVER') {
        await tx.driverLocation.deleteMany({ where: { driverId: id } })
        await tx.driverPerformance.deleteMany({ where: { driverId: id } })
      }

      if (user.role === 'CUSTOMER') {
        await tx.loyaltyAccount.deleteMany({ where: { customerId: id } })
        await tx.wallet.deleteMany({ where: { customerId: id } })
      }

      // Delete user
      await tx.user.delete({ where: { id } })
    })

    // Log audit
    await createAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: AuditActions.USER_DELETED,
      resource: AuditResources.USER,
      resourceId: id,
      details: {
        deletedUser: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      status: 'SUCCESS',
    }, request)

    return successResponse({
      message: 'User deleted successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

