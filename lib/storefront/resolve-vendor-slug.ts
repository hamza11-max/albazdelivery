import 'server-only'
import { prisma } from '../prisma'
import { isReservedSubdomain, normalizeHost } from '../domains/utils'

export interface ResolvedStorefrontVendor {
  id: string
  name: string
  phone: string
  vendorSubdomain: string | null
  vendorCustomDomain: string | null
  vendorDomainStatus: 'PENDING' | 'VERIFIED' | 'FAILED'
  storefrontLogoUrl: string | null
  storefrontHeroUrl: string | null
  storefrontTagline: string | null
  storefrontAccentColor: string | null
  storefrontWhatsappPhone: string | null
  city: string | null
}

/**
 * Resolve a vendor for the public storefront APIs from either:
 *  - a slug (vendorSubdomain), e.g. `demo`, or
 *  - a tenant host header set by middleware (`x-tenant-host`), which allows
 *    custom-domain requests to resolve to the right vendor.
 *
 * Only returns vendors whose domain status is `VERIFIED`.
 */
export async function resolveVendorBySlugOrHost({
  slug,
  tenantHost,
}: {
  slug?: string | null
  tenantHost?: string | null
}): Promise<ResolvedStorefrontVendor | null> {
  const normalizedHost = normalizeHost(tenantHost) || null

  if (normalizedHost) {
    const baseDomain =
      normalizeHost(process.env.BASE_DOMAIN || '') || 'albazdelivery.com'
    if (
      normalizedHost !== baseDomain &&
      !normalizedHost.endsWith(`.${baseDomain}`)
    ) {
      const byCustom = await prisma.user.findFirst({
        where: {
          role: 'VENDOR',
          vendorCustomDomain: normalizedHost,
          vendorDomainStatus: 'VERIFIED',
        },
        select: storefrontVendorSelect,
      })
      if (byCustom) return byCustom as ResolvedStorefrontVendor
    }
  }

  const normalizedSlug = slug?.trim().toLowerCase() || null
  if (normalizedSlug && !isReservedSubdomain(normalizedSlug)) {
    const bySlug = await prisma.user.findFirst({
      where: {
        role: 'VENDOR',
        vendorSubdomain: normalizedSlug,
        vendorDomainStatus: 'VERIFIED',
      },
      select: storefrontVendorSelect,
    })
    if (bySlug) return bySlug as ResolvedStorefrontVendor
  }

  return null
}

const storefrontVendorSelect = {
  id: true,
  name: true,
  phone: true,
  vendorSubdomain: true,
  vendorCustomDomain: true,
  vendorDomainStatus: true,
  storefrontLogoUrl: true,
  storefrontHeroUrl: true,
  storefrontTagline: true,
  storefrontAccentColor: true,
  storefrontWhatsappPhone: true,
  city: true,
} as const
