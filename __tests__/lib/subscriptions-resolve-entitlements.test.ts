import { resolveVendorEntitlements } from "../../lib/subscriptions/resolve-entitlements"
import { PLAN_FEATURES } from "../../lib/subscription-plans"

describe("resolveVendorEntitlements", () => {
  it("uses STARTER baseline when paid plan status does not grant features", () => {
    const e = resolveVendorEntitlements({
      plan: "PROFESSIONAL",
      status: "EXPIRED",
      featureOverrides: null,
    })
    expect(e.maxProducts).toBe(PLAN_FEATURES.STARTER.maxProducts)
    expect(e.cloudSync).toBe(PLAN_FEATURES.STARTER.cloudSync)
  })

  it("uses plan baseline when active", () => {
    const e = resolveVendorEntitlements({
      plan: "BUSINESS",
      status: "ACTIVE",
      featureOverrides: null,
    })
    expect(e.apiAccess).toBe(true)
    expect(e.maxProducts).toBe(-1)
    expect(e.brandedSubdomain).toBe(true)
    expect(e.vendorBringYourOwnDomain).toBe(true)
    expect(e.maxStoreCustomDomains).toBe(5)
  })

  it("Professional includes branded subdomain but not vendor BYOD", () => {
    const e = resolveVendorEntitlements({
      plan: "PROFESSIONAL",
      status: "ACTIVE",
      featureOverrides: null,
    })
    expect(e.brandedSubdomain).toBe(true)
    expect(e.vendorBringYourOwnDomain).toBe(false)
    expect(e.maxStoreCustomDomains).toBe(1)
  })

  it("merges boolean and numeric overrides on top of baseline", () => {
    const e = resolveVendorEntitlements({
      plan: "STARTER",
      status: "ACTIVE",
      featureOverrides: { cloudSync: true, maxProducts: 120 },
    })
    expect(e.cloudSync).toBe(true)
    expect(e.maxProducts).toBe(120)
  })

  it("respects starter whatsappFlows override false", () => {
    const e = resolveVendorEntitlements({
      plan: "STARTER",
      status: "ACTIVE",
      featureOverrides: { whatsappFlows: false },
    })
    expect(e.whatsappFlows).toBe(false)
  })
})
