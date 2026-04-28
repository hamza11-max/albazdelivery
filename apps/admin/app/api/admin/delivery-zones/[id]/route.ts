import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError, NotFoundError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../../lib/csrf'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  city: z.string().min(1).max(100).optional(),
  coordinates: z
    .array(z.object({ lat: z.number(), lng: z.number() }))
    .min(3)
    .optional(),
  deliveryFee: z.number().nonnegative().optional(),
  estimatedTime: z.number().int().positive().optional(),
  activeDrivers: z.number().int().nonnegative().optional(),
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
    if (session.user.role !== 'ADMIN') throw new ForbiddenError('Only admins can update zones')
    const { id } = await context.params
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) return errorResponse(new Error(parsed.error.message), 400)
    const zone = await prisma.deliveryZone.findUnique({ where: { id } })
    if (!zone) throw new NotFoundError('Delivery zone')
    const d = parsed.data
    const updated = await prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(d.name != null ? { name: d.name } : {}),
        ...(d.city != null ? { city: d.city } : {}),
        ...(d.coordinates != null ? { coordinates: d.coordinates as any } : {}),
        ...(d.deliveryFee != null ? { deliveryFee: d.deliveryFee } : {}),
        ...(d.estimatedTime != null ? { estimatedTime: d.estimatedTime } : {}),
        ...(d.activeDrivers != null ? { activeDrivers: d.activeDrivers } : {}),
        ...(d.isActive != null ? { isActive: d.isActive } : {}),
      },
    })
    return successResponse({ zone: updated })
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
    if (session.user.role !== 'ADMIN') throw new ForbiddenError('Only admins can delete zones')
    const { id } = await context.params
    const zone = await prisma.deliveryZone.findUnique({ where: { id } })
    if (!zone) throw new NotFoundError('Delivery zone')
    await prisma.deliveryZone.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    return errorResponse(error)
  }
}
