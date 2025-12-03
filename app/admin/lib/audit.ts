import { prisma } from "@/root/lib/prisma"
import type { NextRequest } from "next/server"

export interface AuditLogData {
  userId?: string
  userRole?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  status: "SUCCESS" | "FAILURE"
  errorMessage?: string
}

export async function createAuditLog(
  data: AuditLogData,
  request?: NextRequest
): Promise<void> {
  try {
    const ipAddress = request?.headers.get("x-forwarded-for") || 
                     request?.headers.get("x-real-ip") || 
                     undefined
    const userAgent = request?.headers.get("user-agent") || undefined

    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userRole: data.userRole,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress,
        userAgent,
        details: data.details ? JSON.parse(JSON.stringify(data.details)) : null,
        status: data.status,
        errorMessage: data.errorMessage,
      },
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error("[Audit] Failed to create audit log:", error)
  }
}

export const AuditActions = {
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_UNSUSPENDED: "USER_UNSUSPENDED",
  USER_PASSWORD_RESET: "USER_PASSWORD_RESET",
  REGISTRATION_APPROVED: "REGISTRATION_APPROVED",
  REGISTRATION_REJECTED: "REGISTRATION_REJECTED",
  BULK_USER_SUSPENDED: "BULK_USER_SUSPENDED",
  BULK_USER_DELETED: "BULK_USER_DELETED",
  BULK_USER_UPDATED: "BULK_USER_UPDATED",
  AD_CREATED: "AD_CREATED",
  AD_UPDATED: "AD_UPDATED",
  AD_DELETED: "AD_DELETED",
} as const

export const AuditResources = {
  USER: "USER",
  REGISTRATION_REQUEST: "REGISTRATION_REQUEST",
  AD: "AD",
} as const

