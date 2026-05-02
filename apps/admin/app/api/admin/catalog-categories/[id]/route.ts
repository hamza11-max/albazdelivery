import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../../lib/csrf'
import { z } from 'zod'
import { isFullAdmin } from '@/root/lib/admin-roles'

const patchCat = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  nameFr: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  iconColor: z.string().min(1).optional(),
  iconImage: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const csrf = csrfProtection(request)
  if (csrf) return csrf
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!isFullAdmin(session.user.role)) throw new ForbiddenError('Only admins')
    const { id } = await context.params
    const nid = parseInt(id, 10)
    if (Number.isNaN(nid)) return errorResponse(new Error('Invalid id'), 400)
    const parsed = patchCat.safeParse(await request.json())
    if (!parsed.success) return errorResponse(new Error(parsed.error.message), 400)
    const existing = await prisma.catalogCategory.findUnique({
      where: { id: nid },
      include: { _count: { select: { stores: true } } },
    })
    if (!existing) throw new NotFoundError('Catalog category')

    const d = parsed.data
    const category = await prisma.catalogCategory.update({
      where: { id: nid },
      data: {
        ...(d.name != null ? { name: d.name } : {}),
        ...(d.nameAr != null ? { nameAr: d.nameAr } : {}),
        ...(d.nameFr != null ? { nameFr: d.nameFr } : {}),
        ...(d.color != null ? { color: d.color } : {}),
        ...(d.iconColor != null ? { iconColor: d.iconColor } : {}),
        ...(d.iconImage !== undefined ? { iconImage: d.iconImage } : {}),
        ...(d.sortOrder != null ? { sortOrder: d.sortOrder } : {}),
        ...(d.isActive != null ? { isActive: d.isActive } : {}),
      },
    })
    return successResponse({ category })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const csrf = csrfProtection(request)
  if (csrf) return csrf
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!isFullAdmin(session.user.role)) throw new ForbiddenError('Only admins')
    const { id } = await context.params
    const nid = parseInt(id, 10)
    if (Number.isNaN(nid)) return errorResponse(new Error('Invalid id'), 400)
    const existing = await prisma.catalogCategory.findUnique({
      where: { id: nid },
      include: { _count: { select: { stores: true } } },
    })
    if (!existing) throw new NotFoundError('Catalog category')
    if (existing._count.stores > 0) {
      return errorResponse(new Error('Cannot delete category referenced by stores'), 400)
    }
    await prisma.catalogCategory.delete({ where: { id: nid } })
    return successResponse({ deleted: true })
  } catch (error) {
    return errorResponse(error)
  }
}
