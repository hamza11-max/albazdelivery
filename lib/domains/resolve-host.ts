import { prisma } from '@/root/lib/prisma'
import { extractSubdomain, isReservedSubdomain, normalizeHost } from './utils'

export type TenantScope = 'store' | 'vendor'
export type HostType = 'store-custom-domain' | 'vendor-custom-domain' | 'store-subdomain' | 'vendor-subdomain'

export interface ResolvedTenantContext {
  scope: TenantScope
  host: string
  hostType: HostType
  vendorId: string
  storeId?: string
}

export interface ResolveHostOptions {
  baseDomain?: string
}

const DEFAULT_BASE_DOMAIN = 'albazdelivery.com'

function getBaseDomain(baseDomainOverride?: string): string {
  return normalizeHost(baseDomainOverride || process.env.BASE_DOMAIN || DEFAULT_BASE_DOMAIN) || DEFAULT_BASE_DOMAIN
}

export async function resolveHostTenant(hostHeader: string | null | undefined, options: ResolveHostOptions = {}) {
  const normalizedHost = normalizeHost(hostHeader)
  if (!normalizedHost) return null

  const baseDomain = getBaseDomain(options.baseDomain)

  // 1) Store custom domain
  const storeByCustomDomain = await (prisma.store as any).findFirst({
    where: { customDomain: normalizedHost, domainStatus: 'VERIFIED' },
    select: { id: true, vendorId: true },
  })
  if (storeByCustomDomain) {
    return {
      scope: 'store',
      host: normalizedHost,
      hostType: 'store-custom-domain',
      vendorId: storeByCustomDomain.vendorId,
      storeId: storeByCustomDomain.id,
    } satisfies ResolvedTenantContext
  }

  // 2) Vendor custom domain
  const vendorByCustomDomain = await (prisma.user as any).findFirst({
    where: { role: 'VENDOR', vendorCustomDomain: normalizedHost, vendorDomainStatus: 'VERIFIED' },
    select: { id: true },
  })
  if (vendorByCustomDomain) {
    return {
      scope: 'vendor',
      host: normalizedHost,
      hostType: 'vendor-custom-domain',
      vendorId: vendorByCustomDomain.id,
    } satisfies ResolvedTenantContext
  }

  // 3 + 4) Subdomain fallback under platform base domain
  const candidateSubdomain = extractSubdomain(normalizedHost, baseDomain)
  if (!candidateSubdomain || isReservedSubdomain(candidateSubdomain)) return null

  const storeBySubdomain = await (prisma.store as any).findFirst({
    where: { subdomain: candidateSubdomain, domainStatus: 'VERIFIED' },
    select: { id: true, vendorId: true },
  })
  if (storeBySubdomain) {
    return {
      scope: 'store',
      host: normalizedHost,
      hostType: 'store-subdomain',
      vendorId: storeBySubdomain.vendorId,
      storeId: storeBySubdomain.id,
    } satisfies ResolvedTenantContext
  }

  const vendorBySubdomain = await (prisma.user as any).findFirst({
    where: { role: 'VENDOR', vendorSubdomain: candidateSubdomain, vendorDomainStatus: 'VERIFIED' },
    select: { id: true },
  })
  if (vendorBySubdomain) {
    return {
      scope: 'vendor',
      host: normalizedHost,
      hostType: 'vendor-subdomain',
      vendorId: vendorBySubdomain.id,
    } satisfies ResolvedTenantContext
  }

  return null
}
