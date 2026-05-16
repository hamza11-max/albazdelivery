/**
 * Server-side rules for vendor registration (web vs Electron).
 * Clients may request autoApprove; only this module decides if it is honored.
 */

export type VendorRegistrationChannel = "web" | "electron"

export function parseVendorRegistrationChannel(
  value: unknown
): VendorRegistrationChannel {
  const normalized = String(value || "web").toLowerCase().trim()
  if (normalized === "electron") return "electron"
  return "web"
}

function envFlagEnabled(name: string): boolean {
  const v = String(process.env[name] || "")
    .trim()
    .toLowerCase()
  return v === "1" || v === "true" || v === "yes"
}

/** When true, Electron channel may auto-approve vendors (never honored for web). */
export function isVendorAutoApproveEnvAllowed(): boolean {
  if (envFlagEnabled("ALLOW_VENDOR_AUTO_APPROVE")) return true
  if (process.env.NODE_ENV === "development") return true
  return false
}

export function resolveVendorAutoApprove(input: {
  role: string
  channel: VendorRegistrationChannel
  clientRequestedAutoApprove?: boolean
}): boolean {
  if (input.role !== "VENDOR") return false
  if (input.channel === "web") return false
  if (input.channel !== "electron") return false
  if (!input.clientRequestedAutoApprove) return false
  return isVendorAutoApproveEnvAllowed()
}

export function vendorRegistrationPendingMessage(channel: VendorRegistrationChannel): string {
  if (channel === "electron") {
    return "Registration request submitted. Your account is pending admin approval before you can sign in."
  }
  return "Registration request submitted successfully. Awaiting admin approval."
}
