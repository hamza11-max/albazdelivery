import { resolveVendorAutoApprove } from "../../../lib/auth/vendor-registration-policy"

describe("register route vendor policy (unit)", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.ALLOW_VENDOR_AUTO_APPROVE = "1"
    process.env.NODE_ENV = "test"
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("web channel never auto-approves even with client flag", () => {
    expect(
      resolveVendorAutoApprove({
        role: "VENDOR",
        channel: "web",
        clientRequestedAutoApprove: true,
      })
    ).toBe(false)
  })

  it("electron channel can auto-approve when env allows", () => {
    expect(
      resolveVendorAutoApprove({
        role: "VENDOR",
        channel: "electron",
        clientRequestedAutoApprove: true,
      })
    ).toBe(true)
  })
})
