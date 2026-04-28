import { auth } from '@/lib/auth'
import { ForbiddenError, UnauthorizedError } from '@/lib/errors'

/**
 * Phase A — server-side session helpers for API routes.
 * Vendor “staff” sub-roles remain client-side; this enforces **platform** roles only.
 */
export async function requireSessionUser() {
  const session = await auth()
  if (!session?.user) {
    throw new UnauthorizedError()
  }
  return session
}

export async function requireVendorOrAdmin() {
  const session = await requireSessionUser()
  const role = String(session.user.role || '').toUpperCase()
  if (role !== 'VENDOR' && role !== 'ADMIN') {
    throw new ForbiddenError('Vendors and admins only')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireSessionUser()
  if (String(session.user.role || '').toUpperCase() !== 'ADMIN') {
    throw new ForbiddenError('Admins only')
  }
  return session
}
