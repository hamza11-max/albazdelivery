import {
  decodeUserHandle,
  encodeUserHandle,
  hashToken,
  normalizeCredentialId,
  randomChallenge,
} from "@/root/lib/webauthn/common"

describe("webauthn common utils", () => {
  it("encodes and decodes user handles", () => {
    const original = "user_cuid_123"
    const encoded = encodeUserHandle(original)
    expect(encoded).toBeTruthy()
    expect(decodeUserHandle(encoded)).toBe(original)
  })

  it("creates unique URL-safe challenges", () => {
    const first = randomChallenge()
    const second = randomChallenge()
    expect(first).not.toEqual(second)
    expect(first).toMatch(/^[A-Za-z0-9\-_]+$/)
  })

  it("normalizes credential IDs", () => {
    expect(normalizeCredentialId("  abcd  ")).toBe("abcd")
  })

  it("hashes tokens deterministically", () => {
    expect(hashToken("token-value")).toEqual(hashToken("token-value"))
    expect(hashToken("token-value")).not.toEqual(hashToken("other-token"))
  })
})
