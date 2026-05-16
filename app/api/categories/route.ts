import { type NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { prisma } from '@/root/lib/prisma'
import { resolveStorefrontTenant } from '@/root/lib/domains/resolve-tenant-from-headers'
import { getVendorCategories } from '@/root/lib/storefront/catalog'

// GET /api/categories — active rows from CatalogCategory (see prisma/seed.ts)
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const tenant = await resolveStorefrontTenant()
    if (tenant) {
      const categories = await getVendorCategories(tenant.vendor.id)
      return successResponse({ vendorId: tenant.vendor.id, categories })
    }

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
