import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  validateCsrfToken as validateRootCsrfToken,
  generateCsrfToken as generateRootCsrfToken,
  CSRF_TOKEN_HEADER,
  CSRF_COOKIE_NAME,
  constantTimeCompare
} from '@/root/lib/security/csrf'

/**
 * CSRF Protection for Admin App
 * Uses the root CSRF utilities but provides admin-specific helpers
 */

/**
 * Validate CSRF token for admin API routes
 * Only validates for state-changing methods (POST, PUT, PATCH, DELETE)
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const method = request.method.toUpperCase()
  
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }

  // Use root validation function
  return validateRootCsrfToken(request)
}

/**
 * Get CSRF token from cookies or generate new one
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!token) {
    token = generateRootCsrfToken()
  }

  return token
}

/**
 * Set CSRF token in response cookie
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

/**
 * CSRF protection middleware for admin routes
 * Returns error response if CSRF validation fails
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase()
  
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null
  }

  // Skip CSRF validation for NextAuth routes (they have their own protection)
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return null
  }

  // Validate CSRF token
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
        },
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Check if request needs CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
}

