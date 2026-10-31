"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter"
import { ThemeProvider } from "@mui/material/styles"
import { createVendorMuiTheme } from "@/lib/mui-theme"

function useHtmlColorMode(): "light" | "dark" {
  const [mode, setMode] = useState<"light" | "dark">("light")

  useEffect(() => {
    const read = () => {
      setMode(
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      )
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return mode
}

export function MuiProvider({ children }: { children: ReactNode }) {
  const mode = useHtmlColorMode()
  const theme = useMemo(() => createVendorMuiTheme(mode), [mode])

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  )
}
