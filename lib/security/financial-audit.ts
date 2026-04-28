/**
 * Financial audit helpers — use only from server routes (API handlers / server actions).
 * Avoid `server-only` here so Jest can import the module in unit tests.
 */
import type { NextRequest } from 'next/server'
import { createAuditLog } from './audit-log'
import { getClientInfo } from './audit-client-info'

/** Standardized actions for money-impacting admin operations (queryable in AuditLog). */
export const FinancialAuditActions = {
  REFUND_REJECTED: 'REFUND_REJECTED',
  REFUND_COMPLETED: 'REFUND_COMPLETED',
  PAYOUT_RECORD_CREATED: 'PAYOUT_RECORD_CREATED',
} as const

export type FinancialResource = 'REFUND' | 'VENDOR_PAYOUT'

/**
 * Append-only financial audit trail for admin actions (refunds, manual payout ledger rows).
 */
export async function auditFinancialAdminAction(
  action: string,
  resource: FinancialResource,
  resourceId: string,
  adminId: string,
  request: NextRequest,
  details?: Record<string, unknown>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request)

  await createAuditLog({
    userId: adminId,
    userRole: 'ADMIN',
    action,
    resource,
    resourceId,
    ipAddress,
    userAgent,
    details,
    status: 'SUCCESS',
  })
}
