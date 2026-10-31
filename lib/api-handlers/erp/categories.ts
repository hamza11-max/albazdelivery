import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { getSessionFromRequest } from '@/lib/get-session-from-request'
import {
  resolveVendorOwnerContextId,
  userActsAsVendorOwner,
} from '@/lib/vendor-staff-access'

// GET - Fetch all unique categories from inventory products
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await getSessionFromRequest(request)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendor = session.user.role === 'VENDOR'

    if (!isAdmin && !isVendor) {
      throw new ForbiddenError('Only vendors or admins can access categories')
    }

    const vendorIdParam = request.nextUrl.searchParams.get('vendorId')
    let vendorId: string | null = isAdmin ? vendorIdParam : null

    if (!isAdmin && session.user.id) {
      vendorId = await resolveVendorOwnerContextId(session.user.id)
    }

    if (isAdmin && vendorIdParam) {
      vendorId = vendorIdParam
    }

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
      }
    }

    if (isVendor && vendorIdParam && vendorIdParam !== vendorId) {
      const allowed = await userActsAsVendorOwner({
        actorId: session.user.id,
        vendorOwnerId: vendorIdParam,
      })
      if (!allowed) {
        throw new ForbiddenError('Not allowed to access categories for this vendor')
      }
      vendorId = vendorIdParam
    }

    if (!vendorId) {
      return successResponse({
        categories: [],
      })
    }

    const where: any = {
      vendorId,
      category: { not: null },
    }

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

    const categories = products
      .map((p) => p.category)
      .filter((cat): cat is string => cat !== null && cat !== undefined)
      .filter((cat, index, self) => self.indexOf(cat) === index)
      .sort()

    return successResponse({
      categories: categories.map((name) => ({
        id: name,
        name,
        nameAr: name,
        nameFr: name,
      })),
    })
  } catch (error) {
    console.error('[API] Categories GET error:', error)
    return errorResponse(error)
  }
}

