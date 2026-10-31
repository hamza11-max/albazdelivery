import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { tryGetElectronJwtSecret } from '@/root/lib/electron-jwt-secret'
import { isElectronAppRequest, isLoopbackRequest } from '@/root/lib/electron-request'

interface ElectronUser {
  userId: string
  email: string
  role: string
  vendorId?: string
}

/**
 * Thin helper for Electron Bearer tokens.
 * Prefer {@link getSessionFromRequest} for API routes (includes DB status revalidation).
 */
export function verifyElectronToken(request: NextRequest): ElectronUser | null {
  if (!isElectronAppRequest(request)) {
    return null
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  if (token.startsWith('electron-dev-')) {
    if (process.env.NODE_ENV !== 'development' || !isLoopbackRequest(request)) {
      return null
    }
    return {
      userId: 'electron-dev',
      email: 'dev@electron.local',
      role: 'VENDOR',
    }
  }

  const secret = tryGetElectronJwtSecret()
  if (!secret) {
    return null
  }

  try {
    return jwt.verify(token, secret) as ElectronUser
  } catch (error) {
    console.error('[Electron Auth] Token verification failed:', error)
    return null
  }
}

export function isElectronRequest(request: NextRequest): boolean {
  return isElectronAppRequest(request)
}
