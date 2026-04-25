import 'server-only'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import {
  extractSubdomain,
  isReservedSubdomain,
  normalizeHost,
} from './utils'

export interface StorefrontVendor {
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
  address: string | null
}

export interface ResolvedStorefrontTenant {
  vendor: StorefrontVendor
  host: string
  hostType: 'subdomain' | 'custom-domain' | 'base-domain'
  subdomain: string | null
  customDomain: string | null
  previewUrl: string
}

const DEFAULT_BASE_DOMAIN = 'albazdelivery.com'

function getBaseDomain(): string {
  return (
    normalizeHost(process.env.BASE_DOMAIN || '') || DEFAULT_BASE_DOMAIN
  )
}

/**
 * Resolve the storefront vendor from request headers set by middleware
 * (`x-tenant-host`, `x-tenant-subdomain`). Falls back to the `slugHint`
 * (the `[vendorSlug]` URL segment) when no subdomain is available —
 * useful for local development via direct `/s/demo/...` access.
 *
 * Returns null if no matching VERIFIED vendor is found.
 */
export async function resolveStorefrontTenant(
  slugHint?: string | null
): Promise<ResolvedStorefrontTenant | null> {
  const headerList = await headers()
  const rawHost = headerList.get('x-tenant-host') || headerList.get('host')
  const host = normalizeHost(rawHost) || ''
  const baseDomain = getBaseDomain()

  const headerSubdomain = headerList.get('x-tenant-subdomain')
  const extractedSubdomain = host
    ? extractSubdomain(host, baseDomain)
    : null
  const subdomain =
    headerSubdomain ||
    extractedSubdomain ||
    (slugHint && slugHint !== '__host__' ? slugHint : null)

  // 1) Resolve by verified custom domain (full host match)
  if (host && host !== baseDomain && !host.endsWith(`.${baseDomain}`)) {
    const vendorByCustom = await prisma.user.findFirst({
      where: {
        role: 'VENDOR',
        vendorCustomDomain: host,
        vendorDomainStatus: 'VERIFIED',
      },
      select: vendorStorefrontSelect,
    })
    if (vendorByCustom) {
      return {
        vendor: vendorByCustom as StorefrontVendor,
        host,
        hostType: 'custom-domain',
        subdomain: vendorByCustom.vendorSubdomain,
        customDomain: vendorByCustom.vendorCustomDomain,
        previewUrl: `https://${vendorByCustom.vendorCustomDomain}`,
      }
    }
  }

  // 2) Resolve by verified subdomain (accept header, extracted, or URL slug hint)
  if (subdomain && !isReservedSubdomain(subdomain)) {
    const vendorBySub = await prisma.user.findFirst({
      where: {
        role: 'VENDOR',
        vendorSubdomain: subdomain,
        vendorDomainStatus: 'VERIFIED',
      },
      select: vendorStorefrontSelect,
    })
    if (vendorBySub) {
      return {
        vendor: vendorBySub as StorefrontVendor,
        host: host || `${subdomain}.${baseDomain}`,
        hostType: 'subdomain',
        subdomain,
        customDomain: vendorBySub.vendorCustomDomain,
        previewUrl: `https://${subdomain}.${baseDomain}`,
      }
    }
  }

  return null
}

const vendorStorefrontSelect = {
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
  address: true,
} as const
