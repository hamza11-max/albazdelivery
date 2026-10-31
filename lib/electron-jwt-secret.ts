/**
 * Secret used to mint/verify Electron desktop JWTs.
 * Fail closed: never fall back to a hardcoded string.
 */
export function getElectronJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (!secret || !secret.trim()) {
    throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is required for Electron JWT auth")
  }
  return secret.trim()
}

export function tryGetElectronJwtSecret(): string | null {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (!secret || !secret.trim()) return null
  return secret.trim()
}
