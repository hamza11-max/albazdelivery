import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })
test.describe('Phase 1 money API boundaries', () => {
  test.setTimeout(90_000)

  test('POST /api/payments/create-intent without session returns 401', async ({ request }) => {
    const res = await request.post('/api/payments/create-intent', {
      data: { orderId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', amount: 1000, currency: 'usd' },
    })
    expect(res.status()).toBe(401)
  })
})
