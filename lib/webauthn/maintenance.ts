import { prisma } from "@/root/lib/prisma"

/**
 * Best-effort cleanup for replay-sensitive ephemeral records.
 * Runs inline in auth flows and intentionally does not throw.
 */
export async function cleanupExpiredWebAuthnState(): Promise<void> {
  const now = new Date()
  try {
    await Promise.all([
      prisma.webAuthnChallenge.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: now } }, { consumedAt: { not: null } }],
        },
      }),
      prisma.webAuthnPasskeyAuthGrant.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: now } }, { consumedAt: { not: null } }],
        },
      }),
    ])
  } catch {
    // ignore cleanup errors
  }
}
