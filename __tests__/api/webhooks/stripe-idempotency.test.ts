import { describe, it, expect, jest, beforeEach } from '@jest/globals'

const mockCreate = jest.fn() as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>

jest.mock('@/root/lib/prisma', () => ({
  prisma: {
    processedStripeWebhookEvent: {
      create: (args: unknown) => mockCreate(args),
    },
  },
}))

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: () => ({
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_x',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            cancel_at_period_end: false,
          },
        },
      }),
    },
  },
}))

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({
    get: (name: string) => (name === 'stripe-signature' ? 't=1,v1=fake' : null),
  })),
}))

jest.mock('@/lib/observability/money-path-log', () => ({
  logMoneyPathEvent: jest.fn(),
  captureMoneyPathException: jest.fn(),
}))

describe('Stripe webhook idempotency', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  it('returns 200 with duplicate when event id was already stored', async () => {
    const err: any = new Error('Unique constraint')
    err.code = 'P2002'
    mockCreate.mockRejectedValue(err)

    const { POST } = await import('../../../app/api/webhooks/stripe/route')
    const res = await POST(
      new Request('http://localhost/api/webhooks/stripe', { method: 'POST', body: '{}' }) as any
    )
    expect(res.status).toBe(200)
    const j = JSON.parse(await res.text())
    expect(j.duplicate).toBe(true)
  })
})
