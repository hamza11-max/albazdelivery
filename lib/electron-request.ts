/** True when the desktop renderer marks the request as Electron. */
export function isElectronAppRequest(request: Request): boolean {
  return request.headers.get("x-electron-app") === "true"
}

function isLoopbackHost(host: string): boolean {
  const h = host.trim().toLowerCase().replace(/^\[|\]$/g, "")
  return h === "localhost" || h === "127.0.0.1" || h === "::1"
}

/**
 * Best-effort loopback check for Electron offline bypasses.
 * Rejects when X-Forwarded-For points at a non-loopback client.
 */
export function isLoopbackRequest(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first && !isLoopbackHost(first.split(":")[0] || first)) {
      return false
    }
  }
  try {
    const url = new URL(request.url)
    return isLoopbackHost(url.hostname)
  } catch {
    return false
  }
}

/**
 * Offline inventory fallback (local-/electron- vendor ids) is only allowed from
 * the Electron app on loopback — never for arbitrary cloud callers.
 */
export function allowElectronOfflineBypass(request: Request): boolean {
  return isElectronAppRequest(request) && isLoopbackRequest(request)
}
