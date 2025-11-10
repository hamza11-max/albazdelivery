import { NextRequest, NextResponse } from 'next/server'
import { getCsrfToken, setCsrfTokenCookie } from '@/lib/security/csrf'
import { successResponse } from '@/lib/errors'

/**
 * GET /api/csrf-token
 * Returns CSRF token for client-side requests
 */
export async function GET(request: NextRequest) {
  try {
    // Get existing token or generate new one
    const token = await getCsrfToken()

    // Create response
    const response = successResponse({ token })

    // Set CSRF token cookie
    setCsrfTokenCookie(response, token)

    return response
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CSRF_TOKEN_ERROR',
          message: 'Failed to generate CSRF token',
        },
      },
      { status: 500 }
    )
  }
}

