import { test, expect } from '@playwright/test'

/**
 * Boundary checks for authenticated analytics routes — no login required for these expectations.
 * Serial + timeout align with cold `next dev` startup (see playwright.config.ts).
 */
test.describe.configure({ mode: 'serial' })
test.describe('Phase C API boundaries', () => {
  test.setTimeout(90_000)
  test.setTimeout(90_000)

  test('GET /api/analytics/demand-prediction without auth returns 401', async ({
    request,
  }) => {
    const res = await request.get('/api/analytics/demand-prediction')
    expect(res.status()).toBe(401)
  })
})
