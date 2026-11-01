"use client"

import { useEffect } from "react"

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    // Desktop app: the UI comes from its own local server, so offline caching only risks showing an
    // old version after an update. Remove any worker a previous version registered.
    if ((window as any).electronAPI?.isElectron) {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {})
      return
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore registration failures in unsupported contexts.
    })
  }, [])

  return null
}
