"use client"

import Link from "next/link"
import {
  Bell,
  HelpCircle,
  LayoutDashboard,
  Minimize2,
  Moon,
  Settings,
  Sun,
  UserCircle2,
  LogOut,
} from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/root/components/ui/button"
import { Badge } from "@/root/components/ui/badge"
import { cn } from "@/root/lib/utils"
import { BRAND_MARK_SRC } from "@/lib/brand-mark"

/** Primary green (wordmark) — Lucide uses currentColor for stroke. */
const iconGreen = "text-albaz-green-700 dark:text-albaz-green-300"

/** Accent orange (bird / alerts) */
const iconOrange = "text-albaz-orange-600 dark:text-albaz-orange-400"

/** Consistent toolbar icon geometry: 22px, outline weight aligned with Lucide default stroke. */
const navIconSize = "h-[22px] w-[22px]"

const strokeNav = 2

interface VendorTopbarProps {
  isElectronRuntime: boolean
  isArabic?: boolean
  isDarkMode: boolean
  notificationCount: number
  translate: (fr: string, ar: string) => string
  onOpenDashboard: () => void
  onOpenSettings: () => void
  onOpenProfile: () => void
  onOpenNotifications: () => void
  onOpenMenuPage: () => void
  onOpenHelp: () => void
  onMinimize: () => void
  onLogout: () => void
  onToggleTheme: () => void
}

function TopIconButton({
  title,
  onClick,
  children,
  className,
}: {
  title: string
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "neu-button relative h-10 w-10 shrink-0 rounded-full border-transparent bg-transparent sm:h-11 sm:w-11",
        iconGreen,
        className,
      )}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  )
}

export function VendorTopbar({
  isElectronRuntime,
  isArabic = false,
  isDarkMode,
  notificationCount,
  translate,
  onOpenDashboard,
  onOpenSettings,
  onOpenProfile,
  onOpenNotifications,
  onOpenMenuPage,
  onOpenHelp,
  onMinimize,
  onLogout,
  onToggleTheme,
}: VendorTopbarProps) {
  return (
    <header className="glass-panel sticky top-0 z-50 mb-4 rounded-none border-x-0 border-t-0 px-3 py-3 shadow-sm sm:px-4">
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3",
          isArabic ? "flex-row-reverse" : "",
        )}
      >
        {/* Brand lockup: official asset, full mark, no circular crop */}
        <div
          className={cn(
            "flex min-w-0 items-center gap-2 sm:gap-3",
            isArabic ? "flex-row-reverse" : "",
          )}
        >
          <Link
            href="/vendor"
            className={cn(
              "flex shrink-0 items-center rounded-sm p-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-albaz-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label="ALBAZ"
          >
            <img
              src={BRAND_MARK_SRC}
              alt="ALBAZ"
              width={320}
              height={100}
              decoding="async"
              fetchPriority="high"
              className={cn(
                "h-7 w-auto max-h-8 object-contain object-left",
                "drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]",
                "dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.35),0_1px_3px_rgba(0,0,0,0.45)]",
              )}
            />
          </Link>
          <div className="hidden min-w-0 truncate text-sm font-semibold text-foreground min-[420px]:block">
            {translate("AlBaz Vendor", "الباز للبائع")}
          </div>
        </div>

        <div
          className={cn(
            "flex max-w-full items-center justify-center gap-2 overflow-x-auto pb-1 sm:gap-2.5 lg:overflow-visible",
            isArabic ? "flex-row-reverse" : "",
          )}
          aria-label={translate("Actions rapides", "إجراءات سريعة")}
        >
          <TopIconButton
            title={
              isDarkMode
                ? translate("Thème clair", "الوضع الفاتح")
                : translate("Thème sombre", "الوضع الداكن")
            }
            onClick={onToggleTheme}
            className={cn(isDarkMode ? iconOrange : iconGreen)}
          >
            {isDarkMode ? (
              <Sun className={navIconSize} strokeWidth={strokeNav} />
            ) : (
              <Moon className={navIconSize} strokeWidth={strokeNav} />
            )}
          </TopIconButton>
          <TopIconButton title={translate("Tableau de bord", "لوحة التحكم")} onClick={onOpenDashboard}>
            <LayoutDashboard className={navIconSize} strokeWidth={strokeNav} />
          </TopIconButton>
          <TopIconButton title={translate("Paramètres", "الإعدادات")} onClick={onOpenSettings}>
            <Settings className={navIconSize} strokeWidth={strokeNav} />
          </TopIconButton>
          <TopIconButton title={translate("Profil", "الملف الشخصي")} onClick={onOpenProfile}>
            <UserCircle2 className={navIconSize} strokeWidth={strokeNav} />
          </TopIconButton>
          <TopIconButton
            title={translate("Notifications", "الإشعارات")}
            onClick={onOpenNotifications}
            className={iconOrange}
          >
            <Bell className={navIconSize} strokeWidth={strokeNav} />
            {notificationCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full border-0 bg-albaz-orange-500 px-1 text-[10px] text-white hover:bg-albaz-orange-600">
                {notificationCount > 99 ? "99+" : notificationCount}
              </Badge>
            )}
          </TopIconButton>
          <TopIconButton title={translate("Menu", "القائمة")} onClick={onOpenMenuPage}>
            <img
              src={BRAND_MARK_SRC}
              alt="ALBAZ menu"
              width={22}
              height={22}
              className="h-[22px] w-[22px] rounded-sm object-contain"
            />
          </TopIconButton>
          <TopIconButton title={translate("Aide", "مساعدة")} onClick={onOpenHelp} className={iconOrange}>
            <HelpCircle className={navIconSize} strokeWidth={strokeNav} />
          </TopIconButton>
        </div>

        <div
          className={cn(
            "flex min-w-0 items-center justify-end gap-2",
            isArabic ? "justify-start" : "",
          )}
        >
          {isElectronRuntime && (
            <TopIconButton title={translate("Minimiser", "تصغير")} onClick={onMinimize}>
              <Minimize2 className={navIconSize} strokeWidth={strokeNav} />
            </TopIconButton>
          )}
          <TopIconButton title={translate("Déconnexion", "تسجيل الخروج")} onClick={onLogout}>
            <LogOut className={navIconSize} strokeWidth={strokeNav} />
          </TopIconButton>
        </div>
      </div>
    </header>
  )
}
