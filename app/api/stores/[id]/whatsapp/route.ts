import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'

const patchSchema = z.object({
  whatsappPhoneNumberId: z.string().min(1).max(64).nullable().optional(),
  whatsappBusinessAccountId: z.string().min(1).max(64).nullable().optional(),
  whatsappOnboardingStatus: z.string().max(32).nullable().optional(),
  whatsappAccessToken: z.string().min(1).nullable().optional(),
  /** When true, clears stored access token */
  clearWhatsAppAccessToken: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const storeId = params.id
    if (!storeId) {
      return errorResponse(new Error('Store ID is required'), 400)
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        vendorId: true,
        whatsappPhoneNumberId: true,
        whatsappBusinessAccountId: true,
        whatsappOnboardingStatus: true,
        whatsappAccessToken: true,
      },
    })

    if (!store) {
      return errorResponse(new Error('Store not found'), 404)
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = session.user.role === 'VENDOR' && session.user.id === store.vendorId
    if (!isAdmin && !isOwner) {
      throw new ForbiddenError('Not allowed to view this store')
    }

    return successResponse({
      whatsapp: {
        whatsappPhoneNumberId: store.whatsappPhoneNumberId,
        whatsappBusinessAccountId: store.whatsappBusinessAccountId,
        whatsappOnboardingStatus: store.whatsappOnboardingStatus,
        hasAccessToken: Boolean(store.whatsappAccessToken?.length),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, vendorId: true },
    })

    if (!store) {
      return errorResponse(new Error('Store not found'), 404)
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = session.user.role === 'VENDOR' && session.user.id === store.vendorId
    if (!isAdmin && !isOwner) {
      throw new ForbiddenError('Not allowed to update this store')
    }

    const body = await request.json()
    const data = patchSchema.parse(body)

    const updatePayload: Parameters<typeof prisma.store.update>[0]['data'] = {}

    if (data.whatsappPhoneNumberId !== undefined) {
      updatePayload.whatsappPhoneNumberId = data.whatsappPhoneNumberId
    }
    if (data.whatsappBusinessAccountId !== undefined) {
      updatePayload.whatsappBusinessAccountId = data.whatsappBusinessAccountId
    }
    if (data.whatsappOnboardingStatus !== undefined) {
      updatePayload.whatsappOnboardingStatus = data.whatsappOnboardingStatus
    }
    if (data.clearWhatsAppAccessToken) {
      updatePayload.whatsappAccessToken = null
    } else if (data.whatsappAccessToken !== undefined && data.whatsappAccessToken !== null) {
      updatePayload.whatsappAccessToken = data.whatsappAccessToken
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: updatePayload,
      select: {
        id: true,
        whatsappPhoneNumberId: true,
        whatsappBusinessAccountId: true,
        whatsappOnboardingStatus: true,
        whatsappAccessToken: true,
      },
    })

    return successResponse({
      whatsapp: {
        whatsappPhoneNumberId: updated.whatsappPhoneNumberId,
        whatsappBusinessAccountId: updated.whatsappBusinessAccountId,
        whatsappOnboardingStatus: updated.whatsappOnboardingStatus,
        hasAccessToken: Boolean(updated.whatsappAccessToken?.length),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
