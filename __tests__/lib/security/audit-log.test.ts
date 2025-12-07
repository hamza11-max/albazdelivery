import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  createAuditLog,
  getClientInfo,
  auditAuthEvent,
  auditDataAccess,
  auditSecurityEvent,
} from '@/lib/security/audit-log'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}))

describe('Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('getClientInfo', () => {
    // Mock NextRequest for testing
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: (name: string) => headers[name.toLowerCase()] || null,
        },
      } as unknown as NextRequest
    }

    it('should extract IP address from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      })
      const info = getClientInfo(request)
      expect(info.ipAddress).toBe('192.168.1.1')
    })

    it('should extract IP address from x-real-ip header', () => {
      const request = createMockRequest({
        'x-real-ip': '192.168.1.2',
      })
      const info = getClientInfo(request)
      expect(info.ipAddress).toBe('192.168.1.2')
    })

    it('should extract IP address from cf-connecting-ip header', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '192.168.1.3',
        'x-real-ip': '192.168.1.2',
      })
      const info = getClientInfo(request)
      expect(info.ipAddress).toBe('192.168.1.3') // cf-connecting-ip takes priority
    })

    it('should extract user agent', () => {
      const request = createMockRequest({
        'user-agent': 'Mozilla/5.0 Test Browser',
      })
      const info = getClientInfo(request)
      expect(info.userAgent).toBe('Mozilla/5.0 Test Browser')
    })

    it('should return unknown for missing information', () => {
      const request = createMockRequest({})
      const info = getClientInfo(request)
      expect(info.ipAddress).toBe('unknown')
      expect(info.userAgent).toBe('unknown')
    })
  })

  describe('createAuditLog', () => {
    it('should create audit log entry', async () => {
      const { prisma } = await import('@/lib/prisma')
      const createSpy = jest.spyOn(prisma.auditLog, 'create')

      await createAuditLog({
        userId: 'user123',
        userRole: 'CUSTOMER',
        action: 'TEST_ACTION',
        resource: 'TEST_RESOURCE',
        status: 'SUCCESS',
      })

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          userRole: 'CUSTOMER',
          action: 'TEST_ACTION',
          resource: 'TEST_RESOURCE',
          status: 'SUCCESS',
        }),
      })
    })

    it('should handle null values', async () => {
      const { prisma } = await import('@/lib/prisma')
      const createSpy = jest.spyOn(prisma.auditLog, 'create')

      await createAuditLog({
        action: 'TEST_ACTION',
        resource: 'TEST_RESOURCE',
        status: 'SUCCESS',
      })

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          userRole: null,
          action: 'TEST_ACTION',
          resource: 'TEST_RESOURCE',
          status: 'SUCCESS',
        }),
      })
    })

    it('should handle database errors gracefully', async () => {
      const { prisma } = await import('@/lib/prisma')
      jest.spyOn(prisma.auditLog, 'create').mockRejectedValueOnce(new Error('Database error'))

      // Should not throw
      await expect(
        createAuditLog({
          action: 'TEST_ACTION',
          resource: 'TEST_RESOURCE',
          status: 'SUCCESS',
        })
      ).resolves.not.toThrow()
    })
  })

  describe('auditAuthEvent', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: (name: string) => headers[name.toLowerCase()] || null,
        },
      } as unknown as NextRequest
    }

    it('should log authentication events', async () => {
      const { prisma } = await import('@/lib/prisma')
      const createSpy = jest.spyOn(prisma.auditLog, 'create')

      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Test Browser',
      })

      await auditAuthEvent('LOGIN', 'user123', 'CUSTOMER', request)

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          userRole: 'CUSTOMER',
          action: 'LOGIN',
          resource: 'AUTH',
          status: 'SUCCESS',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
        }),
      })
    })

    it('should log failed login attempts', async () => {
      const { prisma } = await import('@/lib/prisma')
      const createSpy = jest.spyOn(prisma.auditLog, 'create')

      const request = createMockRequest({})

      await auditAuthEvent('LOGIN_FAILED', 'user123', 'CUSTOMER', request, 'Invalid password')

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'LOGIN_FAILED',
          status: 'FAILURE',
          errorMessage: 'Invalid password',
        }),
      })
    })
  })

  describe('auditDataAccess', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: (name: string) => headers[name.toLowerCase()] || null,
        },
      } as unknown as NextRequest
    }

    it('should log data access events', async () => {
      const { prisma } = await import('@/lib/prisma')
      const createSpy = jest.spyOn(prisma.auditLog, 'create')

      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
      })

      await auditDataAccess('CREATE', 'ORDER', 'order123', 'user123', 'CUSTOMER', request, {
        amount: 100,
      })

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          userRole: 'CUSTOMER',
          action: 'CREATE',
          resource: 'ORDER',
          resourceId: 'order123',
          status: 'SUCCESS',
          details: expect.objectContaining({
            amount: 100,
          }),
        }),
      })
    })
  })

  describe('auditSecurityEvent', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: (name: string) => headers[name.toLowerCase()] || null,
        },
      } as unknown as NextRequest
    }

    it('should log security events', async () => {
      const { prisma } = await import('@/lib/prisma')
      const createSpy = jest.spyOn(prisma.auditLog, 'create')

      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
      })

      await auditSecurityEvent('CSRF_TOKEN_INVALID', 'user123', 'CUSTOMER', request, {
        path: '/api/test',
      })

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CSRF_TOKEN_INVALID',
          resource: 'SECURITY',
          status: 'FAILURE',
          details: expect.objectContaining({
            path: '/api/test',
          }),
        }),
      })
    })
  })
})

