import { test, expect } from '@playwright/test'

test.describe('Phase 2 vendor / ERP API boundaries', () => {
  test.setTimeout(90_000)

  test('POST /api/erp/sales without session returns 401', async ({ request }) => {
    const res = await request.post('/api/erp/sales')
    expect(res.status()).toBe(401)
  })

  test('GET /api/erp/inventory without session returns 401', async ({ request }) => {
    const res = await request.get('/api/erp/inventory')
    expect(res.status()).toBe(401)
  })
})
