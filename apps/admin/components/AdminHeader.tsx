"use client"

import { Button } from "@albaz/ui"
import { LogOut, Sun, Moon, Globe, KeyRound } from "lucide-react"
import { signOut } from "next-auth/react"

interface AdminHeaderProps {
  language: string
  setLanguage: (lang: string) => void
  isDarkMode: boolean
  setIsDarkMode: (dark: boolean) => void
  onPasskeysClick?: () => void
}

export function AdminHeader({ language, setLanguage, isDarkMode, setIsDarkMode, onPasskeysClick }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 albaz-nav">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AL-baz" className="h-10 w-auto" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }} />
            <div>
              <h1 className="text-lg font-bold text-[var(--albaz-text)] dark:text-white">Panneau d'Administration</h1>
              <p className="text-xs text-[var(--albaz-text-soft)] dark:text-white/80">AL-baz Delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onPasskeysClick && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10 gap-2"
                onClick={onPasskeysClick}
                title="Passkeys"
              >
                <KeyRound className="w-4 h-4" />
                Passkeys
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10"
              onClick={() => setLanguage(language === "fr" ? "ar" : "fr")}
              title={language === "fr" ? "العربية" : "Français"}
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10" 
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

