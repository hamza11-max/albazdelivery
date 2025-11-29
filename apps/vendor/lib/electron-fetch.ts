/**
 * Electron-aware fetch wrapper
 * Adds authentication headers when running in Electron
 */

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean
      auth: {
        getToken: () => Promise<string | null>
        getUser: () => Promise<any | null>
      }
    }
  }
}

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

  return fetch(url, options)
}

export function isElectronRuntime(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron
}

