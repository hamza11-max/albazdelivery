import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// PUT /api/admin/ads/[id] - Update an ad (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Check authorization (admin only)
    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can update ads')
    }

    const body = await request.json()
    const { titleFr, titleAr, descriptionFr, descriptionAr, imageUrl, linkUrl, isActive, displayOrder } = body

    // Check if ad exists
    const existingAd = await prisma.ad.findUnique({
      where: { id: params.id },
    })

    if (!existingAd) {
      throw new NotFoundError('Ad not found')
    }

    const ad = await prisma.ad.update({
      where: { id: params.id },
      data: {
        ...(titleFr !== undefined && { titleFr }),
        ...(titleAr !== undefined && { titleAr }),
        ...(descriptionFr !== undefined && { descriptionFr }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    })

    return successResponse({ ad })
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/admin/ads/[id] - Delete an ad (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Check authorization (admin only)
    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can delete ads')
    }

    // Check if ad exists
    const existingAd = await prisma.ad.findUnique({
      where: { id: params.id },
    })

    if (!existingAd) {
      throw new NotFoundError('Ad not found')
    }

    await prisma.ad.delete({
      where: { id: params.id },
    })

    return successResponse({ message: 'Ad deleted successfully' })
  } catch (error) {
    return errorResponse(error)
  }
}

