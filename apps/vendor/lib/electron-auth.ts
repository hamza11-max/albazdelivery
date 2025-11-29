import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface ElectronUser {
  userId: string
  email: string
  role: string
  vendorId?: string
}

export function verifyElectronToken(request: NextRequest): ElectronUser | null {
  const authHeader = request.headers.get('authorization')
  const isElectronApp = request.headers.get('x-electron-app') === 'true'

  if (!isElectronApp || !authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  // Dev tokens bypass verification
  if (token.startsWith('electron-dev-')) {
    return {
      userId: 'electron-dev',
      email: 'dev@electron.local',
      role: 'VENDOR',
    }
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret'
    const decoded = jwt.verify(token, secret) as ElectronUser
    return decoded
  } catch (error) {
    console.error('[Electron Auth] Token verification failed:', error)
    return null
  }
}

export function isElectronRequest(request: NextRequest): boolean {
  return request.headers.get('x-electron-app') === 'true'
}
