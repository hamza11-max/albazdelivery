import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// GET - Fetch all unique categories from products
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can access categories')
    }

    const searchParams = request.nextUrl.searchParams
    const vendorIdParam = searchParams.get('vendorId')

    const targetVendorId = isAdmin ? vendorIdParam : session.user.id

    if (!targetVendorId) {
      return errorResponse(new Error('vendorId is required'), 400)
    }

    // Build where clause - category is required (String, not nullable) so we just filter by vendorId
    const where = {
      vendorId: targetVendorId,
    }

    // Get all products with categories
    let products
    try {
      products = await prisma.inventoryProduct.findMany({
        where,
        select: {
          category: true,
        },
      })
    } catch (dbError) {
      console.error('[Categories API] Database error:', dbError)
      return errorResponse(
        new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`),
        500
      )
    }

    // Handle empty products array (valid scenario)
    if (!products || products.length === 0) {
      return successResponse({ categories: [] })
    }

    // Get unique categories by using a Set
    const uniqueCategories = new Set<string>()
    for (const product of products) {
      if (product.category && typeof product.category === 'string' && product.category.trim() !== '') {
        uniqueCategories.add(product.category.trim())
      }
    }

    // Transform to Category format
    const categories = Array.from(uniqueCategories)
      .sort()
      .map((categoryName, index) => ({
        id: index + 1,
        name: categoryName,
        description: undefined,
        parentId: undefined,
        icon: undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

    return successResponse({ categories })
  } catch (error) {
    console.error('[Categories API] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[Categories API] Error stack:', errorStack)
    return errorResponse(
      new Error(`Failed to fetch categories: ${errorMessage}`),
      500
    )
  }
}

