import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { csrfProtection } from '../../../../lib/csrf'
import { z } from 'zod'

const catPost = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9\-]+$/),
  name: z.string().min(1),
  nameAr: z.string().min(1),
  nameFr: z.string().min(1),
  color: z.string().min(1),
  iconColor: z.string().min(1),
  iconImage: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

/** Full catalog categories (homepage browse). */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can list categories')
    }
    const categories = await prisma.catalogCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        _count: { select: { stores: true } },
      },
    })
    return successResponse({ categories })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  const csrf = csrfProtection(request)
  if (csrf) return csrf
  try {
    await applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (session.user.role !== 'ADMIN') throw new ForbiddenError('Only admins can create categories')
    const data = catPost.parse(await request.json())
    const dup = await prisma.catalogCategory.findUnique({ where: { slug: data.slug } })
    if (dup) return errorResponse(new Error('Slug already exists'), 409)
    const category = await prisma.catalogCategory.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameAr: data.nameAr,
        nameFr: data.nameFr,
        color: data.color,
        iconColor: data.iconColor,
        iconImage: data.iconImage ?? undefined,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    })
    return successResponse({ category }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
