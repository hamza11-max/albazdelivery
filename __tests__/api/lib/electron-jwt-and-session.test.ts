import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { createMockRequest } from '@/__tests__/helpers/test-utils'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => null),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('electron JWT secret + getSessionFromRequest', () => {
  const prevSecret = process.env.NEXTAUTH_SECRET
  const prevAuth = process.env.AUTH_SECRET
  const prevNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.resetModules()
    delete process.env.NEXTAUTH_SECRET
    delete process.env.AUTH_SECRET
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.NEXTAUTH_SECRET
    else process.env.NEXTAUTH_SECRET = prevSecret
    if (prevAuth === undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET = prevAuth
    process.env.NODE_ENV = prevNodeEnv
  })

  it('getElectronJwtSecret fails closed without env secret', async () => {
    const { getElectronJwtSecret } = await import('@/lib/electron-jwt-secret')
    expect(() => getElectronJwtSecret()).toThrow(/required/i)
  })

  it('rejects electron-dev- tokens outside development+loopback', async () => {
    const { getSessionFromRequest } = await import('@/lib/get-session-from-request')
    const request = createMockRequest('http://example.com/api/stores', {
      headers: {
        authorization: 'Bearer electron-dev-fake',
        'x-electron-app': 'true',
      },
    })
    await expect(getSessionFromRequest(request)).resolves.toBeNull()
  })

  it('accepts electron-dev- tokens only in development on loopback', async () => {
    process.env.NODE_ENV = 'development'
    const { getSessionFromRequest } = await import('@/lib/get-session-from-request')
    const request = createMockRequest('http://localhost:3001/api/stores', {
      headers: {
        authorization: 'Bearer electron-dev-ok',
        'x-electron-app': 'true',
      },
    })
    const session = await getSessionFromRequest(request)
    expect(session?.user?.id).toBe('electron-dev')
    expect(session?.user?.role).toBe('VENDOR')
  })

  it('verifies JWT and reloads APPROVED user from DB', async () => {
    process.env.NEXTAUTH_SECRET = 'unit-test-secret-32chars-minimum!!'
    const { prisma } = await import('@/lib/prisma')
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user_1',
      email: 'v@example.com',
      name: 'Vendor',
      role: 'VENDOR',
      status: 'APPROVED',
    })

    const token = jwt.sign(
      { userId: 'user_1', email: 'v@example.com', role: 'VENDOR' },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1h' }
    )

    const { getSessionFromRequest } = await import('@/lib/get-session-from-request')
    const request = createMockRequest('http://localhost:3001/api/x', {
      headers: {
        authorization: `Bearer ${token}`,
        'x-electron-app': 'true',
      },
    })
    const session = await getSessionFromRequest(request)
    expect(session?.user?.id).toBe('user_1')
    expect(session?.user?.status).toBe('APPROVED')
  })

  it('rejects JWT for PENDING vendor', async () => {
    process.env.NEXTAUTH_SECRET = 'unit-test-secret-32chars-minimum!!'
    const { prisma } = await import('@/lib/prisma')
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user_2',
      email: 'p@example.com',
      name: 'Pending',
      role: 'VENDOR',
      status: 'PENDING',
    })

    const token = jwt.sign(
      { userId: 'user_2', email: 'p@example.com', role: 'VENDOR' },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1h' }
    )

    const { getSessionFromRequest } = await import('@/lib/get-session-from-request')
    const request = createMockRequest('http://localhost:3001/api/x', {
      headers: {
        authorization: `Bearer ${token}`,
        'x-electron-app': 'true',
      },
    })
    await expect(getSessionFromRequest(request)).resolves.toBeNull()
  })
})
