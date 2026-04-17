jest.mock("@/root/lib/prisma", () => ({
  prisma: {
    webAuthnPasskeyAuthGrant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { prisma } from "@/root/lib/prisma"
import { consumePasskeyAuthGrant, issuePasskeyAuthGrant } from "@/root/lib/webauthn/grants"

describe("webauthn passkey grants", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("issues a random raw token and stores a hashed grant", async () => {
    ;(prisma.webAuthnPasskeyAuthGrant.create as jest.Mock<any>).mockResolvedValue({ id: "grant-1" })

    const token = await issuePasskeyAuthGrant({ userId: "user-1" })
    expect(token).toHaveLength(48)
    expect(prisma.webAuthnPasskeyAuthGrant.create).toHaveBeenCalled()
  })

  it("consumes a valid grant and returns the user id", async () => {
    ;(prisma.webAuthnPasskeyAuthGrant.findUnique as jest.Mock<any>).mockResolvedValue({
      id: "grant-1",
      userId: "user-2",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    })
    ;(prisma.webAuthnPasskeyAuthGrant.update as jest.Mock<any>).mockResolvedValue({ id: "grant-1" })

    const userId = await consumePasskeyAuthGrant("raw-token")
    expect(userId).toBe("user-2")
    expect(prisma.webAuthnPasskeyAuthGrant.update).toHaveBeenCalled()
  })

  it("rejects expired grants", async () => {
    ;(prisma.webAuthnPasskeyAuthGrant.findUnique as jest.Mock<any>).mockResolvedValue({
      id: "grant-2",
      userId: "user-3",
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    })

    const userId = await consumePasskeyAuthGrant("raw-token")
    expect(userId).toBeNull()
  })
})
