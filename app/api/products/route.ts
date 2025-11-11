import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { createProductSchema, updateProductSchema } from '@/lib/validations/api'
import { z } from 'zod'

// GET /api/products - Get products by store with optional filters
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    const searchParams = request.nextUrl.searchParams
    const storeId = searchParams.get('storeId')
    const category = searchParams.get('category')
    const available = searchParams.get('available')
    const search = searchParams.get('search')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    // Validate storeId
    if (!storeId) {
      return errorResponse(new Error('storeId is required'), 400)
    }

    // Validate storeId format (should be a valid CUID)
    try {
      z.string().cuid().parse(storeId)
    } catch {
      return errorResponse(new Error('Invalid storeId format'), 400)
    }

    // Validate and parse pagination
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(Math.max(1, parseInt(limitParam || '50')), 100)

    // Build where clause
    const where: any = {
      storeId,
      ...(category && { category }),
      ...(available !== null && { available: available === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    // Add price filters if provided
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) {
        const min = parseFloat(minPrice)
        if (!isNaN(min)) {
          where.price.gte = min
        }
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice)
        if (!isNaN(max)) {
          where.price.lte = max
        }
      }
    }

    // Get total count and products with pagination
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: [
          { available: 'desc' }, // Available products first
          { rating: 'desc' },    // Then by rating
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return successResponse({ 
      products,
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

// PATCH /api/products - Update product availability (vendor only)
export async function PATCH(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Only vendors can update their products
    if (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only vendors can update products')
    }

    const body = await request.json()
    
    // Validate request body
    const updateSchema = z.object({
      productId: z.string().cuid('Invalid productId format'),
      available: z.boolean(),
    })
    
    const validatedData = updateSchema.parse(body)
    const { productId, available } = validatedData

    // Get product to verify ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          select: {
            vendorId: true,
          },
        },
      },
    })

    if (!product) {
      throw new NotFoundError('Product')
    }

    // Verify vendor owns this product (unless admin)
    if (session.user.role === 'VENDOR' && product.store.vendorId !== session.user.id) {
      throw new ForbiddenError('You can only update your own products')
    }

    // Update product availability
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { available },
    })

    console.log('[API] Product availability updated:', productId, '->', available)

    return successResponse({ product: updatedProduct })
  } catch (error) {
    return errorResponse(error)
  }
}
