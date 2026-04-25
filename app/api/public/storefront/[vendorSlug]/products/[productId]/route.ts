import { NextRequest } from 'next/server'
import {
  errorResponse,
  NotFoundError,
  successResponse,
} from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { resolveVendorBySlugOrHost } from '@/lib/storefront/resolve-vendor-slug'
import { getVendorProduct } from '@/lib/storefront/catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ vendorSlug: string; productId: string }>
  }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.relaxed)
    const { vendorSlug, productId } = await params

    const vendor = await resolveVendorBySlugOrHost({
      slug: vendorSlug,
      tenantHost: request.headers.get('x-tenant-host'),
    })
    if (!vendor) throw new NotFoundError('Vendor storefront')

    const result = await getVendorProduct(vendor.id, productId)
    if (!result) throw new NotFoundError('Product')

    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
