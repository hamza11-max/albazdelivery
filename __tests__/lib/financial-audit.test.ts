import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import type { NextRequest } from 'next/server'

const mockCreateLog = jest.fn()

jest.mock('../../lib/security/audit-log', () => ({
  createAuditLog: (...args: unknown[]) => mockCreateLog(...args),
}))

describe('auditFinancialAdminAction', () => {
  beforeEach(() => {
    mockCreateLog.mockClear()
  })

  it('persists standardized financial audit fields', async () => {
    const { auditFinancialAdminAction, FinancialAuditActions } = await import(
      '../../lib/security/financial-audit'
    )

    const request = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.1',
        'user-agent': 'jest',
      }),
    } as NextRequest

    await auditFinancialAdminAction(
      FinancialAuditActions.REFUND_COMPLETED,
      'REFUND',
      'refund-c1',
      'admin-c1',
      request,
      { amount: 12.5 }
    )

    expect(mockCreateLog).toHaveBeenCalledTimes(1)
    const entry = mockCreateLog.mock.calls[0][0] as Record<string, unknown>
    expect(entry.action).toBe('REFUND_COMPLETED')
    expect(entry.resource).toBe('REFUND')
    expect(entry.resourceId).toBe('refund-c1')
    expect(entry.userId).toBe('admin-c1')
    expect(entry.userRole).toBe('ADMIN')
    expect(entry.status).toBe('SUCCESS')
    expect(entry.details).toEqual({ amount: 12.5 })
  })
})
