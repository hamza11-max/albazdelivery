import { prisma } from "@/root/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { getClientMetadata } from "./common"

interface PasskeyAuditInput {
  request: Request
  action:
    | "REGISTRATION_OPTIONS_ISSUED"
    | "REGISTRATION_COMPLETED_PENDING"
    | "AUTH_OPTIONS_ISSUED"
    | "AUTH_SUCCESS"
    | "AUTH_FAILED"
    | "ADMIN_APPROVED"
    | "ADMIN_REJECTED"
    | "ADMIN_REVOKED"
  actorUserId?: string | null
  targetUserId?: string | null
  credentialId?: string | null
  details?: Record<string, unknown> | null
}

export async function logPasskeyAuditEvent(input: PasskeyAuditInput): Promise<void> {
  const { ipAddress, userAgent } = getClientMetadata(input.request)
  try {
    await prisma.passkeyAuditLog.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId || undefined,
        targetUserId: input.targetUserId || undefined,
        credentialId: input.credentialId || undefined,
        details: (input.details || undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      },
    })
  } catch {
    // Logging failures should not block auth paths.
  }
}
