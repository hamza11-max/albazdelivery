import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { z } from 'zod'

const createAddressSchema = z.object({
  label: z.string().min(2).max(50),
  address: z.string().min(10),
  city: z.string().min(2),
  isDefault: z.boolean().optional(),
})

const updateAddressSchema = createAddressSchema.partial()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()

    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return successResponse({ addresses })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user?.id) throw new UnauthorizedError()

    const body = await request.json()
    const data = createAddressSchema.parse(body)

    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: session.user.id },
        data: { isDefault: false },
      })
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId: session.user.id,
        label: data.label,
        address: data.address,
        city: data.city,
        isDefault: data.isDefault ?? false,
      },
    })
    return successResponse({ address }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
