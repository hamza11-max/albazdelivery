import { NextRequest } from 'next/server'
import {
  errorResponse,
  NotFoundError,
  successResponse,
} from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { resolveVendorBySlugOrHost } from '@/lib/storefront/resolve-vendor-slug'
import { getVendorCatalog } from '@/lib/storefront/catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorSlug: string }> }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.relaxed)
    const { vendorSlug } = await params

    const vendor = await resolveVendorBySlugOrHost({
      slug: vendorSlug,
      tenantHost: request.headers.get('x-tenant-host'),
    })
    if (!vendor) throw new NotFoundError('Vendor storefront')

    const catalog = await getVendorCatalog(vendor.id)
    return successResponse(catalog)
  } catch (error) {
    return errorResponse(error)
  }
}
