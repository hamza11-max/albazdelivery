import { test, expect } from '@playwright/test'

test.describe('Phase 3 governance / export boundaries', () => {
  test.setTimeout(90_000)

  test('GET /api/user/data-export without session returns 401', async ({ request }) => {
    const res = await request.get('/api/user/data-export')
    expect(res.status()).toBe(401)
  })

  test('GET /api/admin/finance/payouts without session returns 401', async ({ request }) => {
    const res = await request.get('/api/admin/finance/payouts')
    expect(res.status()).toBe(401)
  })
})
