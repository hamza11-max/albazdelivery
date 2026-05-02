import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, ForbiddenError, NotFoundError } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { csrfProtection } from '../../../../admin/lib/csrf'
import { isFullAdmin } from '@/root/lib/admin-roles'
import { z } from 'zod'

const patchSchema = z.object({
  labelFr: z.string().min(1).optional(),
  subjectFr: z.string().min(1).optional(),
  bodyFr: z.string().min(1).optional(),
  subjectAr: z.string().optional(),
  bodyAr: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const csrf = csrfProtection(request)
  if (csrf) return csrf

  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user || !isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins')
    }

    const { key: rawKey } = await context.params
    const key = decodeURIComponent(rawKey || '').trim()
    if (!key) {
      return errorResponse(new Error('Missing key'), 400)
    }

    const body = patchSchema.parse(await request.json())

    const existing = await prisma.emailTemplate.findUnique({ where: { key } })
    if (!existing) {
      throw new NotFoundError('Email template')
    }

    const updated = await prisma.emailTemplate.update({
      where: { key },
      data: {
        ...body,
        updatedById: session.user.id,
      },
    })

    return successResponse({ template: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
