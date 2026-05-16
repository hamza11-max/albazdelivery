import type { VendorRegistrationChannel } from "./vendor-registration-policy"

export type RegistrationRole = "CUSTOMER" | "VENDOR" | "DRIVER"

export interface RegistrationPayload {
  name: string
  email: string
  phone: string
  password: string
  role: RegistrationRole
  shopType?: string
  licenseNumber?: string
  vehicleType?: string
  photoUrl?: string
  address?: string
  city?: string
}

export interface RegistrationSubmitOptions {
  /** Defaults to `/api/auth/register` */
  registerPath?: string
  registrationChannel?: VendorRegistrationChannel
  /** Electron first-owner setup only; server may ignore if policy disallows */
  autoApprove?: boolean
}

export function normalizeAlgerianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("213")) {
    const rest = digits.slice(3)
    return rest.startsWith("0") ? rest : `0${rest}`
  }
  return digits.startsWith("0") ? digits : phone
}

export async function submitRegistrationRequest(
  payload: RegistrationPayload,
  options: RegistrationSubmitOptions = {}
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const registerPath = options.registerPath ?? "/api/auth/register"
  const body: Record<string, unknown> = {
    ...payload,
    phone: normalizeAlgerianPhone(payload.phone),
    registrationChannel: options.registrationChannel ?? "web",
  }
  if (options.autoApprove) {
    body.autoApprove = true
  }

  const response = await fetch(registerPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message || "Registration failed"
    return { success: false, error: message }
  }

  return { success: true, data: data.data ?? data }
}
