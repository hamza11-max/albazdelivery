import {
  calculateRemainingStoreDomains,
  isDomainWriteStatusAllowed,
  toSupportedPlan,
} from '@/root/lib/subscriptions/domain-entitlements-config'

describe('domain entitlements helpers', () => {
  it('maps unsupported plans to STARTER', () => {
    expect(toSupportedPlan('starter')).toBe('STARTER')
    expect(toSupportedPlan('PROFESSIONAL')).toBe('PROFESSIONAL')
    expect(toSupportedPlan('unknown')).toBe('STARTER')
    expect(toSupportedPlan(null)).toBe('STARTER')
  })

  it('allows writes only for ACTIVE or TRIAL', () => {
    expect(isDomainWriteStatusAllowed('ACTIVE')).toBe(true)
    expect(isDomainWriteStatusAllowed('TRIAL')).toBe(true)
    expect(isDomainWriteStatusAllowed('PAST_DUE')).toBe(false)
    expect(isDomainWriteStatusAllowed('EXPIRED')).toBe(false)
    expect(isDomainWriteStatusAllowed('CANCELLED')).toBe(false)
  })

  it('calculates remaining store domains with cap and unlimited mode', () => {
    expect(calculateRemainingStoreDomains(5, 2)).toBe(3)
    expect(calculateRemainingStoreDomains(1, 3)).toBe(0)
    expect(calculateRemainingStoreDomains(-1, 999)).toBe(-1)
  })
})
