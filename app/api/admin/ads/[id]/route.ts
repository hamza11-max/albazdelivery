import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../../lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '../../../../../lib/audit'
import { z } from 'zod'

const updateAdSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional().or(z.literal('')),
  position: z.enum(['HOME_BANNER', 'HOME_SIDEBAR', 'CATEGORY_TOP', 'CATEGORY_SIDEBAR', 'PRODUCT_PAGE', 'CHECKOUT_PAGE', 'MOBILE_BANNER']).optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
})

// GET /api/admin/ads/[id] - Get specific ad
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
      throw new ForbiddenError('Only admins can access ads')
    }

    const params = await context.params
    const { id } = params

    const ad = await prisma.ad.findUnique({
      where: { id },
    })

    if (!ad) {
      throw new NotFoundError('Ad')
    }

    return successResponse({ ad })
  } catch (error) {
    return errorResponse(error)
  }
}

// PUT /api/admin/ads/[id] - Update ad
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
      throw new ForbiddenError('Only admins can update ads')
    }

    const params = await context.params
    const { id } = params
    const body = await request.json()

    const validatedData = updateAdSchema.parse(body)

    // Check if ad exists
    const existingAd = await prisma.ad.findUnique({
      where: { id },
    })

    if (!existingAd) {
      throw new NotFoundError('Ad')
    }

    // Prepare update data
    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl
    if (validatedData.linkUrl !== undefined) updateData.linkUrl = validatedData.linkUrl || null
    if (validatedData.position !== undefined) updateData.position = validatedData.position
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    }

    const updatedAd = await prisma.ad.update({
      where: { id },
      data: updateData,
    })

    // Log audit
    await createAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: 'AD_UPDATED',
      resource: 'AD',
      resourceId: id,
      details: {
        changes: updateData,
        previous: {
          title: existingAd.title,
          position: existingAd.position,
          isActive: existingAd.isActive,
        },
      },
      status: 'SUCCESS',
    }, request)

    return successResponse({
      ad: updatedAd,
      message: 'Ad updated successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/admin/ads/[id] - Delete ad
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
      throw new ForbiddenError('Only admins can delete ads')
    }

    const params = await context.params
    const { id } = params

    // Check if ad exists
    const ad = await prisma.ad.findUnique({
      where: { id },
    })

    if (!ad) {
      throw new NotFoundError('Ad')
    }

    await prisma.ad.delete({
      where: { id },
    })

    // Log audit
    await createAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: 'AD_DELETED',
      resource: 'AD',
      resourceId: id,
      details: {
        deletedAd: {
          title: ad.title,
          position: ad.position,
        },
      },
      status: 'SUCCESS',
    }, request)

    return successResponse({
      message: 'Ad deleted successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

