import {
  isVendorAutoApproveEnvAllowed,
  parseVendorRegistrationChannel,
  resolveVendorAutoApprove,
} from "../../lib/auth/vendor-registration-policy"

describe("vendor-registration-policy", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.ALLOW_VENDOR_AUTO_APPROVE
    process.env.NODE_ENV = "test"
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("parses registration channel", () => {
    expect(parseVendorRegistrationChannel("electron")).toBe("electron")
    expect(parseVendorRegistrationChannel("web")).toBe("web")
    expect(parseVendorRegistrationChannel(undefined)).toBe("web")
  })

  it("never auto-approves web vendors", () => {
    process.env.ALLOW_VENDOR_AUTO_APPROVE = "1"
    expect(
      resolveVendorAutoApprove({
        role: "VENDOR",
        channel: "web",
        clientRequestedAutoApprove: true,
      })
    ).toBe(false)
  })

  it("auto-approves electron vendors when env allows and client requests", () => {
    process.env.ALLOW_VENDOR_AUTO_APPROVE = "1"
    expect(
      resolveVendorAutoApprove({
        role: "VENDOR",
        channel: "electron",
        clientRequestedAutoApprove: true,
      })
    ).toBe(true)
  })

  it("rejects client autoApprove when env disallows", () => {
    process.env.NODE_ENV = "production"
    delete process.env.ALLOW_VENDOR_AUTO_APPROVE
    expect(isVendorAutoApproveEnvAllowed()).toBe(false)
    expect(
      resolveVendorAutoApprove({
        role: "VENDOR",
        channel: "electron",
        clientRequestedAutoApprove: true,
      })
    ).toBe(false)
  })
})
