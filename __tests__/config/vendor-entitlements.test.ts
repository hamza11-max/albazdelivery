import { canAccessTab, listAccessibleTabIds } from "../../apps/vendor/config/vendorEntitlements"
import { PLAN_FEATURES } from "../../lib/subscription-plans"

describe("vendorEntitlements", () => {
  it("hides rfid for starter plan", () => {
    expect(
      canAccessTab({
        tabId: "rfid",
        shopType: "restaurant",
        planFeatures: PLAN_FEATURES.STARTER,
        subscriptionGrantsFeatures: true,
      })
    ).toBe(false)
  })

  it("allows rfid on enterprise", () => {
    expect(
      canAccessTab({
        tabId: "rfid",
        shopType: "restaurant",
        planFeatures: PLAN_FEATURES.ENTERPRISE,
        subscriptionGrantsFeatures: true,
      })
    ).toBe(true)
  })

  it("hides storefront on electron", () => {
    const ids = listAccessibleTabIds({
      shopType: "restaurant",
      planFeatures: PLAN_FEATURES.PROFESSIONAL,
      isElectron: true,
      subscriptionGrantsFeatures: true,
    })
    expect(ids).not.toContain("storefront")
  })

  it("retail excludes restaurant-only tabs", () => {
    const ids = listAccessibleTabIds({
      shopType: "retail",
      planFeatures: PLAN_FEATURES.ENTERPRISE,
      subscriptionGrantsFeatures: true,
    })
    expect(ids).not.toContain("kitchen")
    expect(ids).not.toContain("dine-qr")
    expect(ids).not.toContain("accounting")
    expect(ids).not.toContain("orders")
    expect(ids).not.toContain("drivers")
    expect(canAccessTab({ tabId: "kitchen", shopType: "retail" })).toBe(false)
    expect(canAccessTab({ tabId: "accounting", shopType: "retail" })).toBe(false)
  })

  it("restaurant includes kitchen, dine-qr, and accounting when flags are on", () => {
    const ids = listAccessibleTabIds({
      shopType: "restaurant",
      planFeatures: PLAN_FEATURES.ENTERPRISE,
      subscriptionGrantsFeatures: true,
    })
    expect(ids).toContain("kitchen")
    expect(ids).toContain("dine-qr")
    expect(ids).toContain("accounting")
    expect(canAccessTab({ tabId: "kitchen", shopType: "restaurant" })).toBe(true)
    expect(canAccessTab({ tabId: "dine-qr", shopType: "restaurant" })).toBe(true)
    expect(canAccessTab({ tabId: "accounting", shopType: "restaurant" })).toBe(true)
  })
})
