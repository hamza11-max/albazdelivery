import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { z } from 'zod'

const updateAddressSchema = z.object({
  label: z.string().min(2).max(50).optional(),
  address: z.string().min(10).optional(),
  city: z.string().min(2).optional(),
  isDefault: z.boolean().optional(),
})

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()

    const { id } = await context.params
    const existing = await prisma.customerAddress.findUnique({ where: { id } })
    if (!existing || existing.customerId !== session.user.id) throw new ForbiddenError('Address not found')

    const body = await request.json()
    const data = updateAddressSchema.parse(body)

    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: session.user.id },
        data: { isDefault: false },
      })
    }

    const address = await prisma.customerAddress.update({
      where: { id },
      data: {
        ...(data.label && { label: data.label }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    })
    return successResponse({ address })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()

    const { id } = await context.params
    const existing = await prisma.customerAddress.findUnique({ where: { id } })
    if (!existing || existing.customerId !== session.user.id) throw new ForbiddenError('Address not found')

    await prisma.customerAddress.delete({ where: { id } })
    return successResponse({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
