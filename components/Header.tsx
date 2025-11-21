"use client"

import { useEffect, useState } from "react"
import { Button } from "@/root/components/ui/button"
import { signOut } from "next-auth/react"
import { Sun, Moon, LogOut, Globe, RefreshCw } from "lucide-react"
import { toggleTheme, getStoredTheme, toggleLanguage, getStoredLanguage } from "@/root/lib/theme"

interface HeaderProps {
  title?: string
  subtitle?: string
  showRefresh?: boolean
  onRefresh?: () => void
  language?: string
  setLanguage?: (lang: string) => void
  isDarkMode?: boolean
  setIsDarkMode?: (mode: boolean) => void
}

export default function Header({
  title = "AL-baz",
  subtitle = "Delivery",
  showRefresh = false,
  onRefresh,
  language: externalLanguage,
  setLanguage: externalSetLanguage,
  isDarkMode: externalIsDarkMode,
  setIsDarkMode: externalSetIsDarkMode,
}: HeaderProps) {
  const [theme, setTheme] = useState(getStoredTheme())
  const [language, setLanguage] = useState(getStoredLanguage())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(getStoredTheme())
    setLanguage(getStoredLanguage())
  }, [])

  const handleThemeToggle = () => {
    const newTheme = toggleTheme()
    setTheme(newTheme)
    externalSetIsDarkMode?.(newTheme === 'dark')
  }

  const handleLanguageToggle = () => {
    const newLanguage = toggleLanguage()
    setLanguage(newLanguage)
    externalSetLanguage?.(newLanguage)
  }

  if (!mounted) {
    return null
  }

  const isDark = theme === 'dark' || 
    (theme === 'system' && typeof window !== 'undefined' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AL-baz" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold">{title}</h1>
              <p className="text-xs text-white/80">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showRefresh && onRefresh && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 transition-colors" 
                onClick={onRefresh}
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-colors"
              onClick={handleLanguageToggle}
              title={language === "fr" ? "العربية" : "Français"}
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-colors"
              onClick={handleThemeToggle}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 transition-colors" 
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
