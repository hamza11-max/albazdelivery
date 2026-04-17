export function isWebAuthnPasskeysEnabled(): boolean {
  const raw = String(process.env.ALBAZ_FEATURE_WEBAUTHN_PASSKEYS || "").trim().toLowerCase()
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
}
