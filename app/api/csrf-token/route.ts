import { NextRequest, NextResponse } from 'next/server'
import { getCsrfToken, setCsrfTokenCookie } from '../../../lib/csrf'
import { successResponse } from '@/root/lib/errors'

/**
 * GET /api/csrf-token - Get CSRF token for client-side requests
 * This endpoint provides the CSRF token that clients need to include
 * in X-CSRF-Token header for mutation requests
 */
export async function GET(request: NextRequest) {
  try {
    // Get or generate CSRF token
    const token = await getCsrfToken()
    
    // Create response
    const response = NextResponse.json(
      successResponse({
        token,
        headerName: 'X-CSRF-Token',
      })
    )

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

