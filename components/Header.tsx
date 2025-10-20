"use client"

import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Sun, Moon, LogOut, Globe, RefreshCw } from "lucide-react"

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
  language = "fr",
  setLanguage = () => {},
  isDarkMode = false,
  setIsDarkMode = () => {},
}: HeaderProps) {

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
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onRefresh}>
                <RefreshCw className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setLanguage(language === "fr" ? "ar" : "fr")}
              title={language === "fr" ? "العربية" : "Français"}
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
