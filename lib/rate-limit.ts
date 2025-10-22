import { TooManyRequestsError } from './errors'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Production-ready Redis-based rate limiter using Upstash
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number // time window in milliseconds
}

export const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
}

/**
 * Apply Redis-based rate limiting
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param ratelimit - Ratelimit instance
 * @returns Object with success status and rate limit info
 */
export async function applyRedisRateLimit(
  identifier: string,
  ratelimit: Ratelimit
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
 * Middleware to apply Redis-based rate limiting
 * @param req - Request object
 * @param ratelimit - Ratelimit instance
 * @throws TooManyRequestsError if rate limit exceeded
 */
export async function applyRateLimit(
  req: Request,
  ratelimit: Ratelimit
): Promise<void> {
  const identifier = getClientIdentifier(req)
  const result = await applyRedisRateLimit(identifier, ratelimit)

  if (!result.success) {
    const resetIn = Math.ceil((result.reset.getTime() - Date.now()) / 1000)
    throw new TooManyRequestsError(
      `Rate limit exceeded. Try again in ${resetIn} seconds.`
    )
  }
}

// Predefined rate limit configurations for different endpoints
export const authRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
  analytics: true,
}) : null

export const apiRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
}) : null

export const strictRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
  analytics: true,
}) : null

export const relaxedRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "1 m"), // 1000 requests per minute
  analytics: true,
}) : null

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
