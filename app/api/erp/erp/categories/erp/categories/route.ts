import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

// GET - Fetch all unique categories from inventory products
export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    // DISABLED for Electron app (no authentication)
    // const session = await auth()
    // if (!session?.user) {
    //   throw new UnauthorizedError()
    // }

    // For Electron app, default to admin mode
    const isAdmin = true // session.user.role === 'ADMIN'
    const isVendor = false // session.user.role === 'VENDOR'

    // if (!isAdmin && !isVendor) {
    //   throw new UnauthorizedError('Only vendors or admins can access categories')
    // }

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')
    let vendorId = isAdmin ? vendorIdParam : null // session.user.id

    // If no vendorId provided in admin mode, get first approved vendor
    if (isAdmin && !vendorId) {
      try {
        const firstVendor = await prisma.user.findFirst({
          where: { role: 'VENDOR', status: 'APPROVED' },
          select: { id: true },
        })
        if (firstVendor) {
          vendorId = firstVendor.id
        }
      } catch (e) {
        console.warn('[API/categories] Error fetching first vendor:', e)
        // Continue without vendorId - will return empty categories below
      }
    }

    // If still no vendorId, return empty categories
    if (!vendorId) {
      return successResponse({
        categories: [],
      })
    }

    // Build where clause
    const where: any = {}
    if (vendorId) {
      where.vendorId = vendorId
    }
    where.category = { not: null }

    // Get all products with categories
    let products: any[] = []
    try {
      products = await prisma.inventoryProduct.findMany({
        where,
        select: {
          category: true,
        },
        distinct: ['category'],
      })
    } catch (e) {
      console.warn('[API/categories] Error fetching products:', e)
      products = []
    }

    // Extract unique categories and filter out nulls
    const categories = products
      .map((p) => p.category)
      .filter((cat): cat is string => cat !== null && cat !== undefined)
      .filter((cat, index, self) => self.indexOf(cat) === index) // Remove duplicates
      .sort()

    return successResponse({
      categories: categories.map((name) => ({
        id: name,
        name,
        nameAr: name, // You can add Arabic translations later
        nameFr: name, // You can add French translations later
      })),
    })
  } catch (error) {
    console.error('[API] Categories GET error:', error)
    return errorResponse(error)
  }
}




