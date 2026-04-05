import type { NextRequest } from 'next/server'

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

export function getClientInfo(request: NextRequest): {
  ipAddress: string
  userAgent: string
} {
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
 * Edge / middleware-safe: console only (no Prisma). Use from middleware;
 * API routes should use audit-log.ts which persists to the database.
 */
export function logAuditConsole(entry: AuditLogEntry): void {
  console.log('[AUDIT LOG]', {
    timestamp: new Date().toISOString(),
    ...entry,
  })
}

export function auditSecurityEventConsole(
  action: 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS' | 'CSRF_TOKEN_INVALID' | 'VALIDATION_ERROR',
  userId?: string,
  userRole?: string,
  request?: NextRequest,
  details?: Record<string, any>
): void {
  const clientInfo = request ? getClientInfo(request) : { ipAddress: 'unknown', userAgent: 'unknown' }

  logAuditConsole({
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
