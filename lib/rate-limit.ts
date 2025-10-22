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

// Production-ready Redis-based rate limiter using Upstash
// Only initialize if environment variables are properly set and not during build time
let redis: any = null
let authRateLimit: any = null
let apiRateLimit: any = null
let strictRateLimit: any = null
let relaxedRateLimit: any = null

// Skip Redis initialization during build time to prevent URL validation errors
// Only initialize in runtime, not during static generation or build
if (typeof window === 'undefined' && // Not in browser
    process.env.NODE_ENV !== 'production' && // Not in production build
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    process.env.UPSTASH_REDIS_REST_URL !== 'your-upstash-url' &&
    process.env.UPSTASH_REDIS_REST_TOKEN !== 'your-upstash-token') {
  try {
    // Only validate URL if it's not a placeholder
    if (process.env.UPSTASH_REDIS_REST_URL.startsWith('http')) {
      new URL(process.env.UPSTASH_REDIS_REST_URL)
    }

    const { Ratelimit } = require("@upstash/ratelimit")
    const { Redis } = require("@upstash/redis")

    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    authRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
    })

    apiRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
    })

    strictRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
    })

    relaxedRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, "1 m"),
      analytics: true,
    })
  } catch (error) {
    console.warn('Redis rate limiting not available:', error)
  }
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number // time window in milliseconds
}

export const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
}

/**
 * Check if a request should be rate limited (in-memory fallback)
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
 * Apply Redis-based rate limiting
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param ratelimit - Ratelimit instance
 * @returns Object with success status and rate limit info
 */
export async function applyRedisRateLimit(
  identifier: string,
  ratelimit: any
): Promise<{ success: boolean; remaining: number; reset: Date }> {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

  return {
    success,
    remaining,
    reset: new Date(reset),
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
 * Middleware to apply rate limiting (Redis if available, in-memory fallback)
 * @param req - Request object
 * @param ratelimit - Ratelimit instance (optional)
 * @throws TooManyRequestsError if rate limit exceeded
 */
export async function applyRateLimit(
  req: Request,
  ratelimit?: any
): Promise<void> {
  const identifier = getClientIdentifier(req)

  if (ratelimit) {
    // Use Redis rate limiting
    const result = await applyRedisRateLimit(identifier, ratelimit)
    if (!result.success) {
      const resetIn = Math.ceil((result.reset.getTime() - Date.now()) / 1000)
      throw new TooManyRequestsError(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`
      )
    }
  } else {
    // Fallback to in-memory rate limiting
    const result = checkRateLimit(identifier)
    if (!result.success) {
      const resetIn = Math.ceil((result.resetTime - Date.now()) / 1000)
      throw new TooManyRequestsError(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`
      )
    }
  }
}

// Export the rate limit instances (already initialized above)
export { authRateLimit, apiRateLimit, strictRateLimit, relaxedRateLimit }

// Legacy rate limit configs for backward compatibility
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
