import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req: NextRequest & { auth: any }) => {
  const { auth: session } = req
  const isLoggedIn = !!session?.user
  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Role-based route protection
  const roleRoutes = {
    '/admin': 'ADMIN',
    '/vendor': 'VENDOR',
    '/driver': 'DRIVER',
  }

  // Check role-based access
  for (const [route, requiredRole] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      if (session.user.role !== requiredRole) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  }

  // Redirect logged-in users away from login/signup
  if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
    const role = session.user.role?.toLowerCase()
    if (role === 'admin' || role === 'vendor' || role === 'driver') {
      return NextResponse.redirect(new URL(`/${role}`, req.url))
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

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
