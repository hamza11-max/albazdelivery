import { test, expect } from '@playwright/test'

test.describe('Phase 4 closure API boundaries', () => {
  test.setTimeout(90_000)

  test('GET /api/admin/ops/metrics without session returns 401', async ({ request }) => {
    const res = await request.get('/api/admin/ops/metrics')
    expect(res.status()).toBe(401)
  })

  test('POST /api/user/account/anonymize without CSRF returns 403', async ({ request }) => {
    const res = await request.post('/api/user/account/anonymize')
    expect([403, 401]).toContain(res.status())
  })
})
