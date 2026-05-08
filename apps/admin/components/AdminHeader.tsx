"use client"

import Link from "next/link"
import { Button } from "@albaz/ui"
import { LogOut, Sun, Moon, Globe, KeyRound } from "lucide-react"
import { signOut } from "next-auth/react"
import type { AdminLanguage } from "../lib/i18n-admin"
import { createAdminT } from "../lib/i18n-admin"

interface AdminHeaderProps {
  language: AdminLanguage
  setLanguage: (lang: AdminLanguage) => void
  isDarkMode: boolean
  setIsDarkMode: (dark: boolean) => void
  /** Support desk agents use a restricted shell — lighter chrome; no passkeys shortcut. */
  supportDesk?: boolean
}

export function AdminHeader({
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode,
  supportDesk = false,
}: AdminHeaderProps) {
  const t = createAdminT(language)
  return (
    <header className="sticky top-0 z-50 albaz-nav">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AL-baz" className="h-10 w-auto" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }} />
            <div>
              <h1 className="text-lg font-bold text-[var(--albaz-text)] dark:text-white">
                {supportDesk
                  ? t("admin.header.support", "Support — Administration", "الدعم — الإدارة")
                  : t("admin.header.panel", "Panneau d'Administration", "لوحة الإدارة")}
              </h1>
              <p className="text-xs text-[var(--albaz-text-soft)] dark:text-white/80">
                {supportDesk
                  ? t("admin.header.supportQueue", "AL-baz · file support", "AL-baz · قائمة الدعم")
                  : t("admin.header.brand", "AL-baz Delivery", "AL-baz للتوصيل")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!supportDesk ? (
              <Button variant="ghost" size="sm" className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10" asChild>
                <Link
                  href="/admin/passkeys"
                  title={t("admin.passkeys", "Passkeys générées", "مفاتيح المرور")}
                >
                  <KeyRound className="w-4 h-4 mr-1.5" />
                  {t("admin.passkeys", "Passkeys", "مفاتيح المرور")}
                </Link>
              </Button>
            ) : null}
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
              title={
                isDarkMode
                  ? t("theme.lightMode", "Mode Clair", "الوضع الفاتح")
                  : t("theme.darkMode", "Mode Sombre", "الوضع الداكن")
              }
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
              title={t("auth.logout", "Se déconnecter", "تسجيل الخروج")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

