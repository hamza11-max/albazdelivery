import crypto from "crypto"
import { prisma } from "@/root/lib/prisma"
import { authGrantExpiryDate, hashToken } from "./common"

export async function issuePasskeyAuthGrant(params: {
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<string> {
  const rawToken = crypto.randomBytes(24).toString("hex")
  const tokenHash = hashToken(rawToken)

  await prisma.webAuthnPasskeyAuthGrant.create({
    data: {
      tokenHash,
      userId: params.userId,
      expiresAt: authGrantExpiryDate(),
      ipAddress: params.ipAddress || undefined,
      userAgent: params.userAgent || undefined,
    },
  })

  return rawToken
}

export async function consumePasskeyAuthGrant(rawToken: string): Promise<string | null> {
  if (!rawToken) return null
  const tokenHash = hashToken(rawToken)
  const now = new Date()

  const grant = await prisma.webAuthnPasskeyAuthGrant.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, consumedAt: true, expiresAt: true },
  })

  if (!grant || grant.consumedAt || grant.expiresAt <= now) {
    return null
  }

  await prisma.webAuthnPasskeyAuthGrant.update({
    where: { id: grant.id },
    data: { consumedAt: now },
  })

  return grant.userId
}
