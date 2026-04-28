import { describe, expect, it } from '@jest/globals'
import { applyRateLimit, type RateLimitConfig } from '@/lib/rate-limit'
import { TooManyRequestsError } from '@/lib/errors'

describe('applyRateLimit (in-memory)', () => {
  it('rejects on second request when in-memory limit exceeded', async () => {
    const ip = `10.99.0.${Math.floor(Math.random() * 200) + 1}`
    const req = new Request('http://localhost/api', {
      headers: { 'x-forwarded-for': ip },
    })
    const tight: RateLimitConfig = { maxRequests: 1, windowMs: 60_000 }

    await applyRateLimit(req, tight)
    await expect(applyRateLimit(req, tight)).rejects.toThrow(TooManyRequestsError)
  })
})
