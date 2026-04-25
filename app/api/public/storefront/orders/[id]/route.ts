import { NextRequest } from 'next/server'
import {
  errorResponse,
  NotFoundError,
  successResponse,
  ValidationError,
} from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { resolveVendorBySlugOrHost } from '@/lib/storefront/resolve-vendor-slug'
import { fetchStorefrontOrder } from '@/lib/storefront/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, rateLimitConfigs.relaxed)
    const { id } = await params
    const token = request.nextUrl.searchParams.get('token')
    const vendorSlug =
      request.nextUrl.searchParams.get('vendorSlug') || undefined
    if (!token) throw new ValidationError('token query param is required')

    const vendor = await resolveVendorBySlugOrHost({
      slug: vendorSlug,
      tenantHost: request.headers.get('x-tenant-host'),
    })
    if (!vendor) throw new NotFoundError('Vendor storefront')

    const order = await fetchStorefrontOrder({
      vendorId: vendor.id,
      orderId: id,
      token,
    })
    if (!order) throw new NotFoundError('Order')

    return successResponse(order)
  } catch (error) {
    return errorResponse(error)
  }
}
