import { type NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { prisma } from '@/root/lib/prisma'

// GET /api/categories — active rows from CatalogCategory (see prisma/seed.ts)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    applyRateLimit(request, rateLimitConfigs.api)

    const rows = await prisma.catalogCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    })

    const categories = rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameAr: r.nameAr,
      nameFr: r.nameFr,
      iconImage: r.iconImage ?? undefined,
      color: r.color,
      iconColor: r.iconColor,
    }))

    return successResponse({ categories })
  } catch (error) {
    return errorResponse(error)
  }
}

