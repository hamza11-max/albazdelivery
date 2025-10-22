import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simplified middleware for Vercel compatibility
// Authentication is handled at the page level with NextAuth
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all requests to proceed - authentication handled by NextAuth at page level
  // This prevents middleware invocation errors on Vercel
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
