import crypto from "crypto"

const CHALLENGE_TTL_MS = 5 * 60 * 1000
const AUTH_GRANT_TTL_MS = 2 * 60 * 1000

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padding = (4 - (base64.length % 4)) % 4
  return base64 + "=".repeat(padding)
}

export function randomChallenge(size = 32): string {
  return toBase64Url(crypto.randomBytes(size).toString("base64"))
}

export function challengeExpiryDate(): Date {
  return new Date(Date.now() + CHALLENGE_TTL_MS)
}

export function authGrantExpiryDate(): Date {
  return new Date(Date.now() + AUTH_GRANT_TTL_MS)
}

export function encodeUserHandle(userId: string): string {
  return toBase64Url(Buffer.from(userId, "utf8").toString("base64"))
}

export function decodeUserHandle(userHandle: string): string | null {
  try {
    const base64 = fromBase64Url(userHandle)
    return Buffer.from(base64, "base64").toString("utf8")
  } catch {
    return null
  }
}

export function normalizeCredentialId(input: string): string {
  return String(input || "").trim()
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(String(token)).digest("hex")
}

export function getClientMetadata(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = request.headers.get("x-forwarded-for")
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip")
  const userAgent = request.headers.get("user-agent")
  return {
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  }
}
