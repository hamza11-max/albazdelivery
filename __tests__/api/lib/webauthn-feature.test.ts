import { isWebAuthnPasskeysEnabled } from "@/root/lib/webauthn/feature"

describe("isWebAuthnPasskeysEnabled", () => {
  const original = process.env.ALBAZ_FEATURE_WEBAUTHN_PASSKEYS

  afterEach(() => {
    if (typeof original === "undefined") {
      delete process.env.ALBAZ_FEATURE_WEBAUTHN_PASSKEYS
    } else {
      process.env.ALBAZ_FEATURE_WEBAUTHN_PASSKEYS = original
    }
  })

  it("returns true for enabled truthy values", () => {
    process.env.ALBAZ_FEATURE_WEBAUTHN_PASSKEYS = "true"
    expect(isWebAuthnPasskeysEnabled()).toBe(true)
    process.env.ALBAZ_FEATURE_WEBAUTHN_PASSKEYS = "1"
    expect(isWebAuthnPasskeysEnabled()).toBe(true)
  })

  it("returns false by default", () => {
    delete process.env.ALBAZ_FEATURE_WEBAUTHN_PASSKEYS
    expect(isWebAuthnPasskeysEnabled()).toBe(false)
  })
})
