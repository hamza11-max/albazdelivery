/**
 * When true, vendor driver fleet (invites, dispatch) is allowed without a paid plan.
 * - Always on when NODE_ENV is development.
 * - Otherwise opt-in via NEXT_PUBLIC_VENDOR_DEV_DRIVER_FLEET=true (e.g. local Electron + next start).
 */
export function vendorDevDriverFleetUnlocked(): boolean {
  if (process.env.NODE_ENV === "development") return true
  return process.env.NEXT_PUBLIC_VENDOR_DEV_DRIVER_FLEET === "true"
}
