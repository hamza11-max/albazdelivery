import { describe, expect, it } from '@jest/globals'
import { applyRateLimit, type RateLimitConfig } from '@/lib/rate-limit'
import { TooManyRequestsError } from '@/lib/errors'

describe('applyRateLimit (in-memory)', () => {
  it('throws synchronously on limit exceed so un-awaited calls are still enforced', () => {
    const ip = `10.99.0.${Math.floor(Math.random() * 200) + 1}`
    const req = new Request('http://localhost/api', {
      headers: { 'x-forwarded-for': ip },
    })
    const tight: RateLimitConfig = { maxRequests: 1, windowMs: 60_000 }

    applyRateLimit(req, tight)

    expect(() => {
      applyRateLimit(req, tight)
    }).toThrow(TooManyRequestsError)
  })
})
