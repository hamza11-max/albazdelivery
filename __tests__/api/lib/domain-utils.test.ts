import {
  extractSubdomain,
  normalizeDomainInput,
  normalizeHost,
  normalizeSubdomainInput,
} from '@/root/lib/domains/utils'

describe('domain utilities', () => {
  it('normalizes host values and strips protocol/path/port/www', () => {
    expect(normalizeHost('https://WWW.Shop.Example.com:443/path')).toBe('shop.example.com')
    expect(normalizeHost(' vendor.albazdelivery.com ')).toBe('vendor.albazdelivery.com')
    expect(normalizeHost('')).toBeNull()
  })

  it('validates custom domains', () => {
    expect(normalizeDomainInput('Store.Example.com')).toBe('store.example.com')
    expect(normalizeDomainInput('https://bad/path')).toBeNull()
  })

  it('validates subdomains and blocks reserved labels', () => {
    expect(normalizeSubdomainInput('my-store')).toBe('my-store')
    expect(normalizeSubdomainInput('admin')).toBeNull()
    expect(normalizeSubdomainInput('INVALID_LABEL')).toBeNull()
  })

  it('extracts subdomain for base domain host', () => {
    expect(extractSubdomain('store.albazdelivery.com', 'albazdelivery.com')).toBe('store')
    expect(extractSubdomain('albazdelivery.com', 'albazdelivery.com')).toBeNull()
    expect(extractSubdomain('a.b.albazdelivery.com', 'albazdelivery.com')).toBeNull()
  })
})
