/**
 * Admin dashboard access: full ADMIN / SUPER_ADMIN vs SUPPORT (support desk).
 * Prefer these helpers over ad-hoc string checks so behavior stays consistent.
 */

export function normalizeUserRole(role: string | undefined | null): string {
  return String(role ?? "").toUpperCase()
}

export function isSuperAdmin(role: string | undefined | null): boolean {
  return normalizeUserRole(role) === "SUPER_ADMIN"
}

/** ADMIN or SUPER_ADMIN — full platform ops (catalog, finance mutations, user mgmt shell). */
export function isFullAdmin(role: string | undefined | null): boolean {
  const r = normalizeUserRole(role)
  return r === "ADMIN" || r === "SUPER_ADMIN"
}

export function isSupportAgent(role: string | undefined | null): boolean {
  return normalizeUserRole(role) === "SUPPORT"
}

/** Either elevated role may open the admin app shell. */
export function canAccessAdminApp(role: string | undefined | null): boolean {
  const r = normalizeUserRole(role)
  return r === "ADMIN" || r === "SUPER_ADMIN" || r === "SUPPORT"
}

/** Read all orders (list + detail) for triage — SUPPORT is view-only. */
export function canViewAllOrdersAsStaff(role: string | undefined | null): boolean {
  const r = normalizeUserRole(role)
  return r === "ADMIN" || r === "SUPER_ADMIN" || r === "SUPPORT"
}

/** Status / driver changes, refunds, manual orders, payouts, catalog mutations, etc. */
export function canMutateOpsAsFullAdmin(role: string | undefined | null): boolean {
  return isFullAdmin(role)
}

/** View or update any customer ticket (admin app / support desk). */
export function canAccessSupportTicketEscalation(role: string | undefined | null): boolean {
  const r = normalizeUserRole(role)
  return r === "ADMIN" || r === "SUPER_ADMIN" || r === "SUPPORT"
}

/** Accounts that only SUPER_ADMIN may delete / bulk-modify (non-self). */
export function isProtectedAdminAccount(role: string | undefined | null): boolean {
  const r = normalizeUserRole(role)
  return r === "ADMIN" || r === "SUPER_ADMIN"
}
