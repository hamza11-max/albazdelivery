import { redirect } from "next/navigation"

/**
 * Legacy root vendor dashboard — canonical app is `apps/vendor`.
 * Set NEXT_PUBLIC_VENDOR_APP_URL (e.g. http://localhost:3001/vendor) for local dev.
 */
export default function LegacyVendorDashboardRedirect() {
  const target =
    process.env.NEXT_PUBLIC_VENDOR_APP_URL?.replace(/\/$/, "") ||
    "/vendor"
  redirect(target)
}
