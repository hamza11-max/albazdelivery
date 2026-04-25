import { NextRequest } from 'next/server'
import {
  errorResponse,
  NotFoundError,
  successResponse,
} from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { resolveVendorBySlugOrHost } from '@/lib/storefront/resolve-vendor-slug'
import { prisma } from '@/lib/prisma'

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

    const stores = await prisma.store.findMany({
      where: { vendorId: vendor.id, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        city: true,
        phone: true,
        rating: true,
        deliveryTime: true,
      },
    })

    return successResponse({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        subdomain: vendor.vendorSubdomain,
        customDomain: vendor.vendorCustomDomain,
        branding: {
          logoUrl: vendor.storefrontLogoUrl,
          heroUrl: vendor.storefrontHeroUrl,
          tagline: vendor.storefrontTagline,
          accentColor: vendor.storefrontAccentColor,
        },
        contact: {
          whatsappPhone: vendor.storefrontWhatsappPhone || vendor.phone,
          city: vendor.city,
        },
      },
      stores,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
