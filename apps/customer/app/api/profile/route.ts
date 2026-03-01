import { type NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ConflictError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { updateProfileSchema } from '@/root/lib/validations/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
      },
    })

    if (!user) {
      throw new UnauthorizedError()
    }

    return successResponse({ profile: user })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validated = updateProfileSchema.safeParse(body)

    if (!validated.success) {
      return errorResponse(new Error(validated.error.errors[0]?.message || 'Invalid input'), 400)
    }

    const { name, phone, address, city } = validated.data

    // Check phone uniqueness if changing
    if (phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, id: { not: session.user.id } },
      })
      if (existing) {
        throw new ConflictError('Phone number already in use')
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (address !== undefined) updateData.address = address || null
    if (city !== undefined) updateData.city = city || null

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
      },
    })

    return successResponse({ profile: user })
  } catch (error) {
    return errorResponse(error)
  }
}
