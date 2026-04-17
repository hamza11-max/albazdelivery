import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import { createMockRequest } from "@/__tests__/helpers/test-utils"

jest.mock("@/root/lib/auth", () => ({
  auth: jest.fn(),
}))

jest.mock("@/root/lib/rate-limit", () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { strict: {} },
}))

jest.mock("@/root/lib/webauthn/feature", () => ({
  isWebAuthnPasskeysEnabled: jest.fn(() => true),
}))

jest.mock("@/root/lib/webauthn/audit", () => ({
  logPasskeyAuditEvent: jest.fn(),
}))

jest.mock("@/root/lib/prisma", () => ({
  prisma: {
    webAuthnCredential: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock("@/apps/admin/lib/csrf", () => ({
  csrfProtection: jest.fn(() => null),
}))

describe("admin webauthn passkey moderation API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("approves a pending passkey", async () => {
    const { auth } = await import("@/root/lib/auth")
    const { prisma } = await import("@/root/lib/prisma")
    ;(auth as jest.Mock<any>).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    })
    ;(prisma.webAuthnCredential.findUnique as jest.Mock<any>).mockResolvedValue({
      id: "cred-1",
      userId: "vendor-1",
      status: "PENDING",
    })
    ;(prisma.webAuthnCredential.update as jest.Mock<any>).mockResolvedValue({ id: "cred-1" })

    const { PATCH } = await import(
      "@/apps/admin/app/api/admin/webauthn-passkeys/[id]/route"
    )
    const request = createMockRequest("http://localhost:3000/api/admin/webauthn-passkeys/cred-1", {
      method: "PATCH",
      body: { action: "approve" },
    })

    const response = await PATCH(request as any, { params: Promise.resolve({ id: "cred-1" }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(prisma.webAuthnCredential.update).toHaveBeenCalled()
  })
})
