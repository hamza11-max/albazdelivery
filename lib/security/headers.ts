import { NextRequest, NextResponse } from 'next/server'

/**
 * Security Headers Middleware
 * Adds security headers to all responses
 */

interface SecurityHeaders {
  [key: string]: string
}

/**
 * Get security headers for the application
 */
export function getSecurityHeaders(): SecurityHeaders {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  const headers: SecurityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
    ].join(', '),
  }

  // Content Security Policy
  // Get the app's origin from NEXTAUTH_URL or use defaults
  const nextAuthUrl = process.env.NEXTAUTH_URL || (isProduction ? 'https://albazdelivery.vercel.app' : 'http://localhost:3000')
  const appOrigin = new URL(nextAuthUrl).origin
  
  if (isProduction) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${appOrigin} https://api.supabase.co https://*.supabase.co`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  } else if (isDevelopment) {
    // More permissive CSP for development
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: http:",
      "font-src 'self' data:",
      `connect-src 'self' ${appOrigin} http://localhost:* https://api.supabase.co https://*.supabase.co ws://localhost:* wss://localhost:*`,
      "frame-ancestors 'none'",
    ].join('; ')
  }

  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  return headers
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const securityHeaders = getSecurityHeaders()

  // Add security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Security headers middleware
 * Applies security headers to all responses
 */
export function securityHeadersMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  return applySecurityHeaders(response)
}

/**
 * CORS headers for API routes
 */
export function getCorsHeaders(): SecurityHeaders {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    process.env.NEXTAUTH_URL || 'http://localhost:3000',
  ]

  const origin = allowedOrigins[0] // For now, use first origin
  // In production, validate against allowedOrigins array

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders()
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  return null
}

