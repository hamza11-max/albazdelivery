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
})
