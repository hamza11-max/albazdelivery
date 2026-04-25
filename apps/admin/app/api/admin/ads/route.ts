import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '../../../../lib/audit'
import { z } from 'zod'

const adSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  titleFr: z.string().min(1, 'French title is required').optional(),
  titleAr: z.string().min(1, 'Arabic title is required').optional(),
  description: z.string().optional(),
  descriptionFr: z.string().optional(),
  descriptionAr: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  linkUrl: z.string().url('Invalid link URL').optional().or(z.literal('')),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
})

// GET /api/admin/ads - List all ads
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access ads')
    }

    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    const where: any = {}

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ad.count({ where }),
    ])

    return successResponse({
      ads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/admin/ads - Create new ad
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
      throw new ForbiddenError('Only admins can create ads')
    }

    const body = await request.json()
    const validatedData = adSchema.parse(body)
    const titleFr = validatedData.titleFr || validatedData.title
    const titleAr = validatedData.titleAr || validatedData.title
    const descriptionFr = validatedData.descriptionFr || validatedData.description || ''
    const descriptionAr = validatedData.descriptionAr || validatedData.description || ''

    if (!titleFr || !titleAr) {
      return errorResponse(new Error('titleFr/titleAr or title is required'), 400)
    }

    const ad = await prisma.ad.create({
      data: {
        titleFr,
        titleAr,
        descriptionFr,
        descriptionAr,
        imageUrl: validatedData.imageUrl || null,
        linkUrl: validatedData.linkUrl || null,
        isActive: validatedData.isActive,
        displayOrder: validatedData.displayOrder || 0,
      },
    })

    // Log audit
    await createAuditLog({
      userId: session.user.id,
      userRole: session.user.role,
      action: 'AD_CREATED',
      resource: 'AD',
      resourceId: ad.id,
      details: {
        titleFr: ad.titleFr,
        displayOrder: ad.displayOrder,
      },
      status: 'SUCCESS',
    }, request)

    return successResponse({
      ad,
      message: 'Ad created successfully',
    })
  } catch (error) {
    return errorResponse(error)
  }
}

