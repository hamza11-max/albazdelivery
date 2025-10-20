import { TooManyRequestsError } from './errors'

// Simple in-memory rate limiter (for development)
// For production, use Redis-based solution like Upstash

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number // time window in milliseconds
}

export const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Object with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultRateLimitConfig
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  // If no record or reset time has passed, create new record
  if (!record || record.resetTime < now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(identifier, newRecord)

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
    }
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  // Increment count
  record.count++
  rateLimitStore.set(identifier, record)

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Get client identifier from request (IP address)
 * @param req - Request object
 * @returns Client identifier
 */
export function getClientIdentifier(req: Request): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')

  return (
    cfConnectingIp ||
    realIp ||
    (forwarded ? forwarded.split(',')[0].trim() : 'unknown')
  )
}

/**
 * Middleware to apply rate limiting
 * @param req - Request object
 * @param config - Rate limit configuration
 * @throws TooManyRequestsError if rate limit exceeded
 */
export function applyRateLimit(
  req: Request,
  config: RateLimitConfig = defaultRateLimitConfig
): void {
  const identifier = getClientIdentifier(req)
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    const resetIn = Math.ceil((result.resetTime - Date.now()) / 1000)
    throw new TooManyRequestsError(
      `Rate limit exceeded. Try again in ${resetIn} seconds.`
    )
  }
}

// Predefined rate limit configurations for different endpoints
export const rateLimitConfigs = {
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 requests per minute
  },
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  },
  relaxed: {
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1000 requests per minute
  },
}

/**
 * Production-ready rate limiter using Upstash Redis
 * Uncomment and use this when you have Redis configured
 */

/*
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
})

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
})

export async function applyRateLimitRedis(
  req: Request,
  ratelimit: Ratelimit
): Promise<void> {
  const identifier = getClientIdentifier(req)
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

  if (!success) {
    const resetIn = Math.ceil((reset - Date.now()) / 1000)
    throw new TooManyRequestsError(
      `Rate limit exceeded. Try again in ${resetIn} seconds.`
    )
  }
}
*/
