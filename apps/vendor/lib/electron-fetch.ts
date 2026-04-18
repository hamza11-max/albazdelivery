/**
 * Electron-aware fetch wrapper
 * Adds authentication headers when running in Electron
 *
 * Window.electronAPI is declared in lib/electron-api.d.ts
 */

export async function electronFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron

  if (isElectron) {
    try {
      const token = await window.electronAPI?.auth?.getToken()
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'X-Electron-App': 'true',
        }
      }
    } catch (e) {
      console.warn('[Electron Fetch] Could not get auth token:', e)
    }
  }

  // Browser: ensure NextAuth session cookies are sent (defaults omit credentials on some stacks).
  const credentials = options.credentials ?? (isElectron ? 'same-origin' : 'include')

  return fetch(url, { ...options, credentials })
}

export function isElectronRuntime(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron
}

