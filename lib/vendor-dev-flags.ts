import { isElectronAppRequest, isLoopbackRequest } from "./electron-request"

/**
 * When true, vendor driver fleet (invites, dispatch) is allowed without a paid plan.
 * - Explicit opt-in: NEXT_PUBLIC_VENDOR_DEV_DRIVER_FLEET=true
 * - Or development + Electron loopback (local desktop), not every NODE_ENV=development deploy
 */
export function vendorDevDriverFleetUnlocked(request?: Request): boolean {
  if (process.env.NEXT_PUBLIC_VENDOR_DEV_DRIVER_FLEET === "true") {
    return true
  }
  if (
    process.env.NODE_ENV === "development" &&
    request &&
    isElectronAppRequest(request) &&
    isLoopbackRequest(request)
  ) {
    return true
  }
  return false
}
