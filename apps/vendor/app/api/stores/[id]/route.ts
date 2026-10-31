import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { getSessionFromRequest } from '@/root/lib/get-session-from-request'
import { UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { userActsAsVendorOwner } from '@/root/lib/vendor-staff-access'

async function assertCanAccessStore(
  sessionUser: { id: string; role: string },
  storeVendorId: string
): Promise<void> {
  if (sessionUser.role === 'ADMIN') return
  if (sessionUser.role !== 'VENDOR') {
    throw new ForbiddenError('Not allowed to access this store')
  }
  const allowed = await userActsAsVendorOwner({
    actorId: sessionUser.id,
    vendorOwnerId: storeVendorId,
  })
  if (!allowed) {
    throw new ForbiddenError('Not allowed to access this store')
  }
}

// GET /api/stores/[id] - Get store by ID (vendor app — authenticated)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await getSessionFromRequest(request)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const storeId = params.id
    if (!storeId) {
      return errorResponse(new Error('Store ID is required'), 400)
    }

    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          vendor: { select: { id: true, name: true, phone: true } },
        },
      })
      if (!store) {
        return errorResponse(new Error('Store not found'), 404)
      }

      await assertCanAccessStore(session.user, store.vendorId)

      // Allow inactive stores so vendor dashboard can load own store
      return successResponse({ store })
    } catch (dbError) {
      if (dbError instanceof ForbiddenError || dbError instanceof UnauthorizedError) {
        throw dbError
      }
      console.warn('[Stores API] Database unavailable:', dbError)
      return errorResponse(new Error('Store not found'), 404)
    }
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/stores/[id] - Update store (e.g. isActive) for vendor/admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await getSessionFromRequest(request)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const storeId = params.id
    if (!storeId) {
      return errorResponse(new Error('Store ID is required'), 400)
    }

    const body = await request.json().catch(() => ({}))
    const { isActive } = body ?? {}
    if (typeof isActive !== 'boolean') {
      return errorResponse(new Error('isActive boolean is required'), 400)
    }

    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, vendorId: true },
      })
      if (!store) {
        return errorResponse(new Error('Store not found'), 404)
      }

      const isAdmin = session.user.role === 'ADMIN'
      const isVendorOwner =
        session.user.role === 'VENDOR' && session.user.id === store.vendorId
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
    } catch (e) {
      if (e instanceof ForbiddenError) throw e
      console.warn('[Stores API] PATCH database error:', e)
      return errorResponse(new Error('Store not found'), 404)
    }
  } catch (error) {
    return errorResponse(error)
  }
}
