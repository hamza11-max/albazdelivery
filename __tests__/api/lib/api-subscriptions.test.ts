import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'

const mockGetSession = jest.fn() as jest.MockedFunction<
  (req: Request) => Promise<unknown>
>
const mockFindUnique = jest.fn() as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>
const mockCreate = jest.fn() as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>
const mockUpsert = jest.fn() as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>

jest.mock('../../../lib/get-session-from-request', () => ({
  getSessionFromRequest: (req: Request) => mockGetSession(req),
}))

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: (args: unknown) => mockFindUnique(args),
      create: (args: unknown) => mockCreate(args),
      upsert: (args: unknown) => mockUpsert(args),
      update: jest.fn(),
    },
  },
}))

jest.mock('../../../lib/stripe', () => ({
  stripe: {},
  PLAN_PRICES: { PROFESSIONAL: 'price_x', BUSINESS: 'price_y', ENTERPRISE: 'price_z' },
}))

describe('api-subscriptions handleSubscriptionsGet', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns { subscription: null } when no row exists (no auto-create)', async () => {
    const { handleSubscriptionsGet } = await import('@/lib/api-subscriptions')
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', role: 'VENDOR' },
    })
    mockFindUnique.mockResolvedValue(null)

    const res = await handleSubscriptionsGet(
      new Request('http://localhost/api/subscriptions')
    )
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data?.subscription).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns wrapped subscription when present', async () => {
    const { handleSubscriptionsGet } = await import('@/lib/api-subscriptions')
    const sub = {
      id: 's1',
      userId: 'u1',
      plan: 'STARTER',
      status: 'TRIAL',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    }
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', role: 'VENDOR' },
    })
    mockFindUnique.mockResolvedValue({ ...sub, subscriptionPayments: [], usage: [] })

    const res = await handleSubscriptionsGet(
      new Request('http://localhost/api/subscriptions')
    )
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data?.subscription?.id).toBe('s1')
  })
})

describe('api-subscriptions handleSubscriptionsPost STARTER gate', () => {
  const env = process.env as Record<string, string | undefined>
  const ORIGINAL_ENV = env.NODE_ENV
  const ORIGINAL_FLAG = env.ALLOW_STARTER_PLAN_WITHOUT_STRIPE

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete env.NODE_ENV
    else env.NODE_ENV = ORIGINAL_ENV
    if (ORIGINAL_FLAG === undefined) delete env.ALLOW_STARTER_PLAN_WITHOUT_STRIPE
    else env.ALLOW_STARTER_PLAN_WITHOUT_STRIPE = ORIGINAL_FLAG
  })

  it('rejects STARTER in production when flag is not set', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      env.NODE_ENV = 'production'
      delete env.ALLOW_STARTER_PLAN_WITHOUT_STRIPE
      const { handleSubscriptionsPost } = await import('@/lib/api-subscriptions')
      mockGetSession.mockResolvedValue({
        user: { id: 'u1', email: 'a@b.com', role: 'VENDOR' },
      })
      mockFindUnique.mockResolvedValue(null)

      const res = await handleSubscriptionsPost(
        new Request('http://localhost/api/subscriptions', {
          method: 'POST',
          body: JSON.stringify({ plan: 'STARTER' }),
          headers: { 'Content-Type': 'application/json' },
        })
      )
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(res.status).toBe(403)
      expect(mockUpsert).not.toHaveBeenCalled()
    } finally {
      errSpy.mockRestore()
    }
  })
})
