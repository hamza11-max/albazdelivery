import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'

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

