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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-orange-500 text-white shadow-lg backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AL-baz" className="h-10 w-auto" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }} />
            <div>
              <h1 className="text-lg font-bold text-white">Panneau d'Administration</h1>
              <p className="text-xs text-white/90">AL-baz Delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:text-white"
              onClick={() => setLanguage(language === "fr" ? "ar" : "fr")}
              title={language === "fr" ? "العربية" : "Français"}
            >
              <Globe className="w-5 h-5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:text-white"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-white" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 hover:text-white" 
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

