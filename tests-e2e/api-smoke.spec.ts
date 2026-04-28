import { test, expect } from '@playwright/test'

/**
 * Smoke tests that do not require auth cookies — validates routing, health, and a few public JSON APIs.
 * Run with: npx playwright test tests-e2e/api-smoke.spec.ts
 *
 * Serial + longer timeout: first `next dev` compile of a route can exceed the default 30s on slow disks.
 */
test.describe.configure({ mode: 'serial' })
test.describe('Public API smoke', () => {
  test.setTimeout(90_000)

  test('GET /api/health returns success', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.database).toBeDefined()
    expect(json.dependencies).toBeDefined()
  })

  test('POST /api/auth/check-status returns 200 (unknown user → status null)', async ({
    request,
  }) => {
    const res = await request.post('/api/auth/check-status', {
      data: { identifier: 'e2e-smoke-nonexistent@test.invalid' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json).toEqual({ status: null })
  })

  test('GET /api/categories returns success with categories array', async ({ request }) => {
    const res = await request.get('/api/categories')
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data?.categories)).toBe(true)
  })
})
