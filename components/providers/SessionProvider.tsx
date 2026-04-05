"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const isElectronRuntime =
    typeof window !== "undefined" && Boolean(window.electronAPI?.isElectron)

  if (isElectronRuntime) {
    // Electron uses IPC auth flow; avoid NextAuth client polling entirely.
    return <>{children}</>
  }

  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60}
      refetchOnWindowFocus
    >
      {children}
    </NextAuthSessionProvider>
  )
}

