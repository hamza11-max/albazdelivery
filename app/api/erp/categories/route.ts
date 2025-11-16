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

    if (isAdmin && !targetVendorId) {
      return errorResponse(new Error('vendorId query parameter is required for admin access'), 400)
    }

    // Build where clause
    const where: any = {}
    if (targetVendorId) {
      where.vendorId = targetVendorId
    }
    where.category = { 
      not: null
    }

    // Get all products with categories
    const products = await prisma.inventoryProduct.findMany({
      where,
      select: {
        category: true,
      },
    })

    // Get unique categories by using a Set
    const uniqueCategories = new Set<string>()
    products.forEach((p) => {
      if (p.category && p.category.trim() !== '') {
        uniqueCategories.add(p.category.trim())
      }
    })

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
    console.error('[Categories API] Error:', error)
    return errorResponse(error)
  }
}

