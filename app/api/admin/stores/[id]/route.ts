/** Mirrored from `apps/admin/app/api/admin/stores/[id]/route.ts` for root deployment. */
import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../../admin/lib/csrf'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  categoryId: z.number().int().positive().optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  deliveryTime: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can view stores')
    }

    const { id } = await context.params

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, nameFr: true, slug: true } },
        _count: { select: { orders: true, products: true } },
      },
    })

    if (!store) {
      throw new NotFoundError('Store')
    }

    return successResponse({ store })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) {
    return csrfResponse
  }

  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can update stores')
    }

    const { id } = await context.params
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse(new Error(parsed.error.message), 400)
    }

    const existing = await prisma.store.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundError('Store')
    }

    const data = parsed.data
    if (data.categoryId != null) {
      const cat = await prisma.catalogCategory.findUnique({ where: { id: data.categoryId } })
      if (!cat) {
        return errorResponse(new Error('Category not found'), 400)
      }
    }

    const updated = await prisma.store.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name } : {}),
        ...(data.type != null ? { type: data.type } : {}),
        ...(data.categoryId != null ? { categoryId: data.categoryId } : {}),
        ...(data.address != null ? { address: data.address } : {}),
        ...(data.city != null ? { city: data.city } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.deliveryTime != null ? { deliveryTime: data.deliveryTime } : {}),
        ...(data.isActive != null ? { isActive: data.isActive } : {}),
      },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, nameFr: true, slug: true } },
      },
    })

    return successResponse({ store: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
