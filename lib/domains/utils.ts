const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'app',
  'support',
  'mail',
  'smtp',
  'pop',
  'imap',
  'localhost',
])

export function normalizeHost(rawHost: string | null | undefined): string | null {
  if (!rawHost) return null
  const trimmed = rawHost.trim().toLowerCase()
  if (!trimmed) return null

  const withoutProtocol = trimmed.replace(/^https?:\/\//, '')
  const withoutPath = withoutProtocol.split('/')[0] || ''
  const withoutPort = withoutPath.split(':')[0] || ''
  const withoutWww = withoutPort.startsWith('www.') ? withoutPort.slice(4) : withoutPort

  return withoutWww || null
}

export function normalizeDomainInput(rawValue: string | null | undefined): string | null {
  const normalized = normalizeHost(rawValue)
  if (!normalized) return null

  // Basic domain validation (ASCII host labels only).
  const isValidDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(normalized)
  if (!isValidDomain) return null

  return normalized
}

export function normalizeSubdomainInput(rawValue: string | null | undefined): string | null {
  if (!rawValue) return null
  const normalized = rawValue.trim().toLowerCase()
  if (!normalized) return null

  const isValid = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized)
  if (!isValid) return null
  if (isReservedSubdomain(normalized)) return null

  return normalized
}

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())
}

export function extractSubdomain(host: string, baseDomain: string): string | null {
  const normalizedHost = normalizeHost(host)
  const normalizedBaseDomain = normalizeHost(baseDomain)
  if (!normalizedHost || !normalizedBaseDomain) return null

  if (normalizedHost === normalizedBaseDomain) return null
  const suffix = `.${normalizedBaseDomain}`
  if (!normalizedHost.endsWith(suffix)) return null

  const label = normalizedHost.slice(0, -suffix.length)
  if (!label || label.includes('.')) return null

  return label
}

export function makeVerificationToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function buildVerificationHost(domain: string): string {
  return `_albaz-verify.${domain}`
}
