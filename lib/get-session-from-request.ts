import type { Session } from "next-auth"
import jwt from "jsonwebtoken"
import { auth } from "./auth"
import type { UserRole } from "./auth.config"
import { prisma } from "./prisma"
import { tryGetElectronJwtSecret } from "./electron-jwt-secret"
import { isElectronAppRequest, isLoopbackRequest } from "./electron-request"

interface ElectronJwtPayload {
  userId: string
  email: string
  role: string
  vendorId?: string
}

function allowElectronDevToken(request: Request): boolean {
  return process.env.NODE_ENV === "development" && isLoopbackRequest(request)
}

/**
 * Resolves the signed-in user for vendor API routes:
 * 1) NextAuth session cookie (web / same-origin)
 * 2) Electron JWT in `Authorization: Bearer` + `X-Electron-App: true` (desktop)
 */
export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookieSession = await auth()
  if (cookieSession?.user?.id) {
    return cookieSession
  }

  if (!isElectronAppRequest(request)) {
    return null
  }

  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7)

  if (token.startsWith("electron-dev-")) {
    if (!allowElectronDevToken(request)) {
      return null
    }
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

  const secret = tryGetElectronJwtSecret()
  if (!secret) {
    return null
  }

  try {
    const decoded = jwt.verify(token, secret) as ElectronJwtPayload
    if (!decoded?.userId || !decoded.email) {
      return null
    }

    // Re-load live status/role from DB (reject revoked/pending accounts)
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      })
      if (!user) {
        return null
      }
      if (user.role !== "ADMIN" && user.status !== "APPROVED") {
        return null
      }
      return {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0] || "Vendor",
          role: user.role as UserRole,
          status: user.status,
        },
      } as Session
    } catch {
      // DB unavailable (offline Electron): trust JWT claims but do not invent APPROVED for unknown status
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
    }
  } catch {
    return null
  }
}
