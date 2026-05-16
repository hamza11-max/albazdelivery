import {
  extractLocalhostVendorSubdomain,
  extractSubdomain,
  isReservedSubdomain,
  buildVerificationHost,
  normalizeDomainInput,
  normalizeHost,
  normalizeSubdomainInput,
} from '@/root/lib/domains/utils'

describe('domain utilities', () => {
  it('normalizes host values and strips protocol/path/port/www', () => {
    expect(normalizeHost('https://WWW.Shop.Example.com:443/path')).toBe('shop.example.com')
    expect(normalizeHost(' vendor.albazdelivery.com ')).toBe('vendor.albazdelivery.com')
    expect(normalizeHost('localhost:3000')).toBe('localhost')
    expect(normalizeHost('demo.AL-BAZ.APP')).toBe('demo.al-baz.app')
    expect(normalizeHost('')).toBeNull()
    expect(normalizeHost(undefined)).toBeNull()
  })

  it('validates custom domains', () => {
    expect(normalizeDomainInput('Store.Example.com')).toBe('store.example.com')
    expect(normalizeDomainInput('https://bad/path')).toBeNull()
  })

  it('validates subdomains and blocks reserved labels', () => {
    expect(normalizeSubdomainInput('my-store')).toBe('my-store')
    expect(normalizeSubdomainInput('admin')).toBeNull()
    expect(normalizeSubdomainInput('INVALID_LABEL')).toBeNull()
    expect(normalizeSubdomainInput('-bad')).toBeNull()
    expect(normalizeSubdomainInput('a')).toBe('a')
  })

  it('detects reserved platform subdomains (case-insensitive)', () => {
    expect(isReservedSubdomain('api')).toBe(true)
    expect(isReservedSubdomain('WWW')).toBe(true)
    expect(isReservedSubdomain('vendor')).toBe(true)
    expect(isReservedSubdomain('drivers')).toBe(true)
    expect(isReservedSubdomain('my-shop')).toBe(false)
    expect(isReservedSubdomain('demo')).toBe(false)
  })

  it('extracts subdomain for base domain host', () => {
    expect(extractSubdomain('store.albazdelivery.com', 'albazdelivery.com')).toBe('store')
    expect(extractSubdomain('store.al-baz.app', 'al-baz.app')).toBe('store')
    expect(extractSubdomain('albazdelivery.com', 'albazdelivery.com')).toBeNull()
    expect(extractSubdomain('a.b.albazdelivery.com', 'albazdelivery.com')).toBeNull()
    expect(extractSubdomain('other.com', 'albazdelivery.com')).toBeNull()
    expect(
      extractSubdomain('https://demo.al-baz.app:443/foo', 'al-baz.app'),
    ).toBe('demo')
  })

  it('extractLocalhostVendorSubdomain for dev hosts', () => {
    expect(extractLocalhostVendorSubdomain('coffee.localhost:3001')).toBe('coffee')
    expect(extractLocalhostVendorSubdomain('multi.label.localhost')).toBeNull()
    expect(extractLocalhostVendorSubdomain('localhost')).toBeNull()
    expect(extractLocalhostVendorSubdomain('vendor.localhost')).toBeNull()
  })

  it('buildVerificationHost prefixes token host', () => {
    expect(buildVerificationHost('shop.example.com')).toBe('_albaz-verify.shop.example.com')
  })

  it('extractSubdomain rejects empty label after strip', () => {
    expect(extractSubdomain('.albazdelivery.com', 'albazdelivery.com')).toBeNull()
  })
})
