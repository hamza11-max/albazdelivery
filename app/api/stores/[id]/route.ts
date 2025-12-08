import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { UnauthorizedError, ForbiddenError } from '@/root/lib/errors'

// GET /api/stores/[id] - Get store by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    const storeId = params.id

    if (!storeId) {
      return errorResponse(new Error('Store ID is required'), 400)
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            nameAr: true,
          },
        },
      },
    })

    if (!store || !store.isActive) {
      return errorResponse(new Error('Store not found'), 404)
    }

    return successResponse({ store })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/stores/[id] - Update store flags (vendor/admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const storeId = params.id
    if (!storeId) {
      return errorResponse(new Error('Store ID is required'), 400)
    }

    const body = await request.json()
    const { isActive } = body ?? {}

    if (typeof isActive !== 'boolean') {
      return errorResponse(new Error('isActive boolean is required'), 400)
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, vendorId: true },
    })

    if (!store) {
      return errorResponse(new Error('Store not found'), 404)
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isVendorOwner = session.user.role === 'VENDOR' && session.user.id === store.vendorId

    if (!isAdmin && !isVendorOwner) {
      throw new ForbiddenError('Not allowed to update this store')
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        vendorId: true,
        city: true,
        address: true,
      },
    })

    return successResponse({ store: updated })
  } catch (error) {
    return errorResponse(error)
  }
}

