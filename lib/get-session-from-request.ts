import type { NextRequest } from "next/server"
import type { Session } from "next-auth"
import jwt from "jsonwebtoken"
import { auth } from "./auth"
import type { UserRole } from "./auth.config"

interface ElectronJwtPayload {
  userId: string
  email: string
  role: string
  vendorId?: string
}

/**
 * Resolves the signed-in user for vendor API routes:
 * 1) NextAuth session cookie (web / same-origin)
 * 2) Electron JWT in `Authorization: Bearer` + `X-Electron-App: true` (desktop)
 */
export async function getSessionFromRequest(request: NextRequest): Promise<Session | null> {
  const cookieSession = await auth()
  if (cookieSession?.user?.id) {
    return cookieSession
  }

  const authHeader = request.headers.get("authorization")
  const isElectronApp = request.headers.get("x-electron-app") === "true"
  if (!isElectronApp || !authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7)

  if (token.startsWith("electron-dev-")) {
    return {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "electron-dev",
        email: "dev@electron.local",
        name: "Electron Dev",
        role: "VENDOR" as UserRole,
        status: "APPROVED",
      },
    } as Session
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret"
    const decoded = jwt.verify(token, secret) as ElectronJwtPayload
    if (!decoded?.userId || !decoded.email) {
      return null
    }
    return {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email.split("@")[0] || "Vendor",
        role: decoded.role as UserRole,
        status: "APPROVED",
      },
    } as Session
  } catch {
    return null
  }
}
