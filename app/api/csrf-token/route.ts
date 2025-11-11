import { NextRequest, NextResponse } from 'next/server'
import { getCsrfToken, setCsrfTokenCookie } from '@/lib/security/csrf'
import { successResponse, errorResponse } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

/**
 * GET /api/csrf-token
 * Returns CSRF token for client-side requests
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (more permissive for CSRF token requests)
    applyRateLimit(request, rateLimitConfigs.auth)

    // Get existing token or generate new one
    const token = await getCsrfToken()

    // Create response
    const response = successResponse({
      token,
      expiresIn: '24h', // Token expires in 24 hours
    })

    // Set CSRF token cookie
    setCsrfTokenCookie(response, token)

    return response
  } catch (error: any) {
    return errorResponse(error, 500)
  }
}

