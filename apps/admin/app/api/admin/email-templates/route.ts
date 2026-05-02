import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { isFullAdmin } from '@/root/lib/admin-roles'
import { ensureDefaultEmailTemplates } from '@/root/lib/mail/default-email-templates'

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user || !isFullAdmin(session.user.role)) {
      throw new ForbiddenError('Only admins')
    }

    await ensureDefaultEmailTemplates()
    const templates = await prisma.emailTemplate.findMany({ orderBy: { key: 'asc' } })

    return successResponse({ templates })
  } catch (error) {
    return errorResponse(error)
  }
}
