"use client"

import { useEffect } from "react"

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore registration failures in unsupported contexts.
    })
  }, [])

  return null
}
