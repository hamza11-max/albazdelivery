import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { Role, NotificationType } from '@/root/generated/prisma/client'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../../lib/csrf'
import { z } from 'zod'

const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.nativeEnum(NotificationType).optional().default(NotificationType.SYSTEM),
  recipientRole: z.nativeEnum(Role).optional(),
  recipientIds: z.array(z.string().cuid()).min(1).optional(),
  limit: z.number().int().min(1).max(5000).optional().default(500),
})

/** Create in-app notifications for many users (role or explicit ids). */
export async function POST(request: NextRequest) {
  const csrf = csrfProtection(request)
  if (csrf) return csrf
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== 'ADMIN') throw new ForbiddenError('Only admins can broadcast')
    const body = broadcastSchema.parse(await request.json())
    const { title, message, type, recipientRole, recipientIds, limit } = body

    let targets: { id: string; role: Role }[] = []
    if (recipientIds?.length) {
      const users = await prisma.user.findMany({
        where: { id: { in: recipientIds } },
        select: { id: true, role: true },
      })
      targets = users.map((u) => ({ id: u.id, role: u.role }))
    } else if (recipientRole) {
      const users = await prisma.user.findMany({
        where: { role: recipientRole },
        select: { id: true, role: true },
        take: limit,
      })
      targets = users.map((u) => ({ id: u.id, role: u.role }))
    } else {
      return errorResponse(new Error('Provide recipientIds or recipientRole'), 400)
    }

    if (targets.length === 0) {
      return successResponse({ created: 0, message: 'No recipients' })
    }

    const result = await prisma.notification.createMany({
      data: targets.map((t) => ({
        recipientId: t.id,
        recipientRole: t.role,
        type,
        title,
        message,
      })),
    })

    return successResponse({ created: result.count }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
