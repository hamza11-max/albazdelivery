/**
 * Browser fetch for vendor + shared hooks: sends cookies on web and
 * Electron JWT headers when `window.electronAPI` is present.
 */

type ElectronAuthApi = {
  getToken?: () => Promise<string | null>
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)

  if (typeof window !== "undefined") {
    const api = (window as unknown as { electronAPI?: { isElectron?: boolean; auth?: ElectronAuthApi } })
      .electronAPI
    if (api?.isElectron && api.auth?.getToken) {
      try {
        const token = await api.auth.getToken()
        if (token) {
          headers.set("Authorization", `Bearer ${token}`)
          headers.set("X-Electron-App", "true")
        }
      } catch {
        // ignore
      }
    }
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
  })
}
