"use client"

import { Button } from "@albaz/ui"
import { LogOut, Sun, Moon, Globe } from "lucide-react"
import { signOut } from "next-auth/react"

interface AdminHeaderProps {
  language: string
  setLanguage: (lang: string) => void
  isDarkMode: boolean
  setIsDarkMode: (dark: boolean) => void
}

export function AdminHeader({ language, setLanguage, isDarkMode, setIsDarkMode }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 albaz-nav">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="AL-baz"
              className="h-7 w-auto"
              onError={(e) => {
                const target = e.currentTarget
                target.onerror = null
                target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='36' viewBox='0 0 120 36'%3E%3Crect width='120' height='36' rx='10' fill='%232f5b2f'/%3E%3Ctext x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Inter,Arial' font-size='12' font-weight='700'%3EALBAZ%3C/text%3E%3C/svg%3E"
              }}
            />
            <div>
              <h1 className="text-lg font-bold text-[var(--albaz-text)] dark:text-white">Panneau d'Administration</h1>
              <p className="text-xs text-[var(--albaz-text-soft)] dark:text-white/80">AL-baz Delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

