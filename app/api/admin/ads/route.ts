import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../admin/lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '../../../admin/lib/audit'
import { z } from 'zod'

const adSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL'),
  linkUrl: z.string().url('Invalid link URL').optional().or(z.literal('')),
  position: z.enum(['HOME_BANNER', 'HOME_SIDEBAR', 'CATEGORY_TOP', 'CATEGORY_SIDEBAR', 'PRODUCT_PAGE', 'CHECKOUT_PAGE', 'MOBILE_BANNER']),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
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
    const position = searchParams.get('position')
    const isActive = searchParams.get('isActive')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    const where: any = {}

    if (position) {
      where.position = position
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
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

    const ad = await prisma.ad.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        imageUrl: validatedData.imageUrl,
        linkUrl: validatedData.linkUrl || null,
        position: validatedData.position,
        priority: validatedData.priority,
        isActive: validatedData.isActive,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        createdBy: session.user.id,
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
        title: ad.title,
        position: ad.position,
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

