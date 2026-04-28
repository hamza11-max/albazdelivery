/** Mirrored from `apps/admin/app/api/admin/stores/route.ts` for root deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { z } from 'zod'

/** GET — list stores (optional ?vendorId=) */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can list stores')
    }

    const vendorId = request.nextUrl.searchParams.get('vendorId')
    if (vendorId) {
      try {
        z.string().cuid().parse(vendorId)
      } catch {
        return errorResponse(new Error('Invalid vendor ID'), 400)
      }
    }

    const stores = await prisma.store.findMany({
      where: vendorId ? { vendorId } : undefined,
      include: {
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        category: { select: { id: true, nameFr: true, nameAr: true, slug: true } },
        _count: { select: { orders: true, products: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
    })

    return successResponse({ stores })
  } catch (error) {
    return errorResponse(error)
  }
}
