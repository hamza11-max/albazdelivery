import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET /api/admin/ads - Get all ads (admin only)
export async function GET(request: NextRequest) {
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
      throw new ForbiddenError('Only admins can access this resource')
    }

    const ads = await prisma.ad.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return successResponse({ ads })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/admin/ads - Create a new ad (admin only)
export async function POST(request: NextRequest) {
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
      throw new ForbiddenError('Only admins can create ads')
    }

    const body = await request.json()
    const { titleFr, titleAr, descriptionFr, descriptionAr, imageUrl, linkUrl, isActive, displayOrder } = body

    // Validate required fields
    if (!titleFr || !titleAr || !descriptionFr || !descriptionAr) {
      return errorResponse(new Error('Missing required fields'), 400)
    }

    const ad = await prisma.ad.create({
      data: {
        titleFr,
        titleAr,
        descriptionFr,
        descriptionAr,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0,
      },
    })

    return successResponse({ ad }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

