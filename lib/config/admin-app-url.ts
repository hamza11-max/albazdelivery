const rawAdminAppUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL || ""

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "")
}

const normalizedAdminAppUrl = normalizeBaseUrl(rawAdminAppUrl.trim())

/** Base URL of the Albaz admin app (e.g. http://localhost:3003). Empty if unset. */
export function getAdminAppBaseUrl(): string {
  return normalizedAdminAppUrl
}

/** Admin dashboard; full admins land on Approbations by default. */
export function getAdminApprovalsUrl(): string {
  if (!normalizedAdminAppUrl) return ""
  return `${normalizedAdminAppUrl}/admin`
}
