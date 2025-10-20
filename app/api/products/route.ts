import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

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

    if (!storeId) {
      return errorResponse(new Error('storeId is required'), 400)
    }

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

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { available: 'desc' }, // Available products first
        { rating: 'desc' },    // Then by rating
      ],
    })

    return successResponse({ products })
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
    const { productId, available } = body

    if (productId === undefined || available === undefined) {
      return errorResponse(new Error('productId and available are required'), 400)
    }

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
