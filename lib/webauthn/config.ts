const DEFAULT_RP_NAME = "ALBAZ Vendor"

function parseHost(value: string): string | null {
  try {
    return new URL(value).hostname
  } catch {
    return null
  }
}

export function getWebAuthnRpId(): string {
  const explicit = process.env.ALBAZ_WEBAUTHN_RP_ID
  if (explicit) return explicit

  const fromAuth = process.env.NEXTAUTH_URL ? parseHost(process.env.NEXTAUTH_URL) : null
  if (fromAuth) return fromAuth

  return "localhost"
}

export function getWebAuthnOrigin(): string {
  const explicit = process.env.ALBAZ_WEBAUTHN_ORIGIN
  if (explicit) return explicit

  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  return "http://localhost:3001"
}

export function getWebAuthnRpName(): string {
  return process.env.ALBAZ_WEBAUTHN_RP_NAME || DEFAULT_RP_NAME
}
