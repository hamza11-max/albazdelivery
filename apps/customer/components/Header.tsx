"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Sun, Moon, LogOut, Globe, RefreshCw } from "lucide-react"
import { toggleTheme, getStoredTheme, toggleLanguage, getStoredLanguage } from "@/lib/theme"
import { useProfileI18n } from "@/hooks/use-profile-i18n"

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
  const t = useProfileI18n()
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
            <img
              src="/logo.png"
              alt={t("header-logo-alt", "AL-baz", "الباز", "AL-baz")}
              className="h-10 w-auto"
            />
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
                title={t("header-refresh", "Actualiser", "تحديث", "Refresh")}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-colors"
              onClick={handleLanguageToggle}
              title={
                language === "fr"
                  ? t("header-lang-switch-to-ar", "العربية", "العربية", "Arabic")
                  : language === "ar"
                    ? t("header-lang-switch-to-en", "English", "English", "English")
                    : t("header-lang-switch-to-fr", "Français", "Français", "French")
              }
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-colors"
              onClick={handleThemeToggle}
              title={
                isDark
                  ? t("light-mode", "Mode clair", "وضع النهار", "Light mode")
                  : t("dark-mode", "Mode sombre", "الوضع الليلي", "Dark mode")
              }
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 transition-colors" 
              onClick={() => signOut({ callbackUrl: "/login" })}
              title={t("header-sign-out", "Déconnexion", "تسجيل الخروج", "Sign out")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
