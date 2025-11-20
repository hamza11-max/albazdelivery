import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'

/**
 * Audit Logging
 * Logs important actions for security and compliance
 */

export interface AuditLogEntry {
  userId?: string
  userRole?: string
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  details?: Record<string, any>
  status: 'SUCCESS' | 'FAILURE'
  errorMessage?: string
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Log to console for debugging
    console.log('[AUDIT LOG]', {
      timestamp: new Date().toISOString(),
      ...entry,
    })

    // Store in database
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId || null,
          userRole: entry.userRole || null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : null,
          status: entry.status,
          errorMessage: entry.errorMessage || null,
        },
      })
    } catch (dbError) {
      // If database is not available (e.g., during migration), just log to console
      // Don't throw errors from audit logging to prevent breaking the application
      console.warn('[AUDIT LOG] Database write failed, logged to console only:', dbError)
    }
  } catch (error) {
    // Don't throw errors from audit logging
    console.error('[AUDIT LOG ERROR]', error)
  }
}

/**
 * Get client information from request
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string
  userAgent: string
} {
  // Get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ipAddress =
    cfConnectingIp ||
    realIp ||
    (forwarded ? forwarded.split(',')[0].trim() : 'unknown')

  const userAgent = request.headers.get('user-agent') || 'unknown'

  return { ipAddress, userAgent }
}

/**
 * Audit log helper for authentication events
 */
export async function auditAuthEvent(
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED',
  userId?: string,
  userRole?: string,
  request?: NextRequest,
  errorMessage?: string
): Promise<void> {
  const clientInfo = request ? getClientInfo(request) : { ipAddress: 'unknown', userAgent: 'unknown' }

  await createAuditLog({
    userId,
    userRole,
    action,
    resource: 'AUTH',
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    status: errorMessage ? 'FAILURE' : 'SUCCESS',
    errorMessage,
  })
}

/**
 * Audit log helper for data access events
 */
export async function auditDataAccess(
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  resource: string,
  resourceId: string,
  userId: string,
  userRole: string,
  request: NextRequest,
  details?: Record<string, any>
): Promise<void> {
  const clientInfo = getClientInfo(request)

  await createAuditLog({
    userId,
    userRole,
    action,
    resource,
    resourceId,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    details,
    status: 'SUCCESS',
  })
}

/**
 * Audit log helper for security events
 */
export async function auditSecurityEvent(
  action: 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS' | 'CSRF_TOKEN_INVALID' | 'VALIDATION_ERROR',
  userId?: string,
  userRole?: string,
  request?: NextRequest,
  details?: Record<string, any>
): Promise<void> {
  const clientInfo = request ? getClientInfo(request) : { ipAddress: 'unknown', userAgent: 'unknown' }

  await createAuditLog({
    userId,
    userRole,
    action,
    resource: 'SECURITY',
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    details,
    status: 'FAILURE',
  })
}

/**
 * Audit log helper for admin actions
 */
export async function auditAdminAction(
  action: string,
  resource: string,
  resourceId: string,
  adminId: string,
  request: NextRequest,
  details?: Record<string, any>
): Promise<void> {
  const clientInfo = getClientInfo(request)

  await createAuditLog({
    userId: adminId,
    userRole: 'ADMIN',
    action,
    resource,
    resourceId,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    details,
    status: 'SUCCESS',
  })
}

