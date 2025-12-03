import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * CSRF Token Generation and Validation
 * Implements Double Submit Cookie pattern for CSRF protection
 * 
 * Consistent with middleware.ts:
 * - Cookie: __Host-csrf-token (httpOnly, secure, sameSite: strict)
 * - Header: X-CSRF-Token
 * - Protection: Only for public API mutations (POST, PUT, PATCH, DELETE)
 */

export const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
export const CSRF_COOKIE_NAME = '__Host-csrf-token'

/**
 * Generate a secure random CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  if (typeof window === 'undefined' && typeof crypto !== 'undefined') {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get or create CSRF token from cookies (async version)
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!token) {
    token = generateCsrfToken()
    // Token will be set in middleware
  }

  return token
}

/**
 * Get CSRF token synchronously (for middleware)
 */
export function getCsrfTokenSync(): string {
  return generateCsrfToken()
}

/**
 * Validate CSRF token from request
 * Compares token from header with token from cookie
 * 
 * Matches middleware.ts validation logic
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Skip CSRF validation for safe methods (idempotent)
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER)
  
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

  if (!headerToken || !cookieToken) {
    return false
  }

  // Compare tokens (constant-time comparison to prevent timing attacks)
  return constantTimeCompare(headerToken, cookieToken)
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing requests
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
  // Skip CSRF validation for safe methods
  const method = request.method.toUpperCase()
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
          message: 'Invalid or missing CSRF token',
        },
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Set CSRF token in response cookie
 * 
 * Cookie settings match middleware.ts:
 * - httpOnly: true (not accessible via JavaScript)
 * - secure: true in production (HTTPS only)
 * - sameSite: 'strict' (CSRF protection)
 * - path: '/' (available site-wide)
 * - maxAge: 24 hours
 * 
 * Note: __Host- prefix requires secure=true and path='/'
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    // __Host- prefix requires secure and path='/'
  })
}
