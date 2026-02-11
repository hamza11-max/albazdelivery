"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import {
  LogOut, 
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  Users,
  Truck,
  BarChart3,
  Settings,
  ShoppingBag,
  UserCog,
  Store,
  Percent,
  Database,
  Cloud,
  Mail,
  Shield,
  Gift,
} from "lucide-react"
import { cn } from "../lib/utils"

interface VendorSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  language?: string
  setLanguage?: (lang: string) => void
  isDarkMode?: boolean
  setIsDarkMode?: (mode: boolean) => void
  translate: (fr: string, ar: string) => string
}

interface MenuItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  labelFr: string
  labelAr: string
}

export default function VendorSidebar({
  activeTab,
  setActiveTab,
  language = "fr",
  setLanguage,
  isDarkMode = false,
  setIsDarkMode,
  translate,
}: VendorSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      labelFr: "Tableau de bord",
      labelAr: "لوحة التحكم",
    },
    {
      id: "inventory",
      icon: Package,
      labelFr: "Inventaire",
      labelAr: "المخزون",
    },
    {
      id: "pos",
      icon: ShoppingCart,
      labelFr: "Point de Vente",
      labelAr: "نقطة البيع",
    },
    {
      id: "orders",
      icon: ShoppingBag,
      labelFr: "Commandes",
      labelAr: "الطلبات",
    },
    {
      id: "sales",
      icon: History,
      labelFr: "Ventes",
      labelAr: "المبيعات",
    },
    {
      id: "reports",
      icon: BarChart3,
      labelFr: "Rapports",
      labelAr: "التقارير",
    },
    {
      id: "coupons",
      icon: Percent,
      labelFr: "Coupons",
      labelAr: "الكوبونات",
    },
    {
      id: "sync-save",
      icon: Cloud,
      labelFr: "Sync & Sauvegarde",
      labelAr: "المزامنة والنسخ الاحتياطي",
    },
    {
      id: "email",
      icon: Mail,
      labelFr: "Email",
      labelAr: "البريد الإلكتروني",
    },
    {
      id: "staff-permissions",
      icon: Shield,
      labelFr: "Personnel & Permissions",
      labelAr: "الموظفون والصلاحيات",
    },
    {
      id: "clients-loyalty",
      icon: Gift,
      labelFr: "Clients & Fidélité",
      labelAr: "العملاء والولاء",
    },
    {
      id: "drivers",
      icon: UserCog,
      labelFr: "Chauffeurs",
      labelAr: "السائقون",
    },
    {
      id: "suppliers",
      icon: Truck,
      labelFr: "Fournisseurs",
      labelAr: "الموردون",
    },
    {
      id: "ai",
      icon: BarChart3,
      labelFr: "Analyse IA",
      labelAr: "تحليلات الذكاء الاصطناعي",
    },
    {
      id: "settings",
      icon: Settings,
      labelFr: "Paramètres",
      labelAr: "الإعدادات",
    },
    {
      id: "logout",
      icon: LogOut,
      labelFr: "Déconnexion",
      labelAr: "تسجيل الخروج",
    },
  ]

  // Social icons removed

  return (
    <>
      <aside
        className={cn(
          "fixed left-3 top-4 bottom-4 rounded-2xl shadow-2xl z-50 hidden md:flex md:flex-col transition-all duration-200 ease-in-out",
          "bg-gradient-to-b from-[#0a0f14] via-[#0d1419] to-[#0f181d]",
          "backdrop-blur-xl border border-white/10",
          "text-white"
        )}
        style={{ width: isCollapsed ? 64 : 210 }}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        {/* Navigation Items */}
        <nav className="flex-1 w-full space-y-1 px-2 py-3 overflow-x-hidden overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const label = translate(item.labelFr, item.labelAr)
            const isHovered = hoveredItem === item.id

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => {
                    if (item.id === "logout") {
                      signOut({ callbackUrl: "/login" })
                    } else {
                      setActiveTab(item.id)
                    }
                  }}
                  className={cn(
                    "relative w-full transition-all duration-150 ease-out group",
                    "flex items-center",
                    isCollapsed 
                      ? "justify-center h-11 rounded-xl" 
                      : "gap-3 px-3 py-3 rounded-xl",
                    isActive
                      ? isCollapsed
                        ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 shadow-lg shadow-teal-500/10 scale-105"
                        : "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 shadow-lg shadow-teal-500/10"
                      : "hover:bg-white/5 border border-transparent hover:border-white/10"
                  )}
                >
                  {/* Icon Container */}
                  <div className={cn(
                    "flex-shrink-0 flex items-center justify-center transition-all duration-150",
                    isCollapsed ? "w-9 h-9" : "w-9 h-9",
                    isActive 
                      ? "text-teal-400" 
                      : "text-gray-400 group-hover:text-white"
                  )}>
                    <Icon className={cn(
                      "transition-all duration-150",
                      "w-4 h-4",
                      isActive && "drop-shadow-[0_0_8px_rgba(20,184,166,0.6)]"
                    )} />
                  </div>

                  {/* Label - Only visible when expanded */}
                  {!isCollapsed && (
                    <span className={cn(
                      "font-medium text-sm whitespace-nowrap transition-all duration-300",
                      isActive ? "text-teal-400" : "text-gray-300"
                    )}>
                      {label}
                    </span>
                  )}

                  {/* Active Glow Effect */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 blur-sm -z-10" />
                  )}
                </button>

                {/* Tooltip for collapsed state - Individual tooltip per icon */}
                {isCollapsed && isHovered && (
                  <div 
                    className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50"
                    style={{
                      animation: 'fadeInSlide 0.2s ease-out forwards'
                    }}
                  >
                    <div className={cn(
                      "relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                      "bg-gradient-to-r from-gray-900/95 to-gray-800/95",
                      "backdrop-blur-md border border-teal-400/20",
                      "shadow-xl shadow-teal-500/10",
                      "text-white"
                    )}>
                      {label}
                      {/* Neon accent line */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-teal-400 to-cyan-500 rounded-r-full shadow-lg shadow-teal-400/50" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav (visible on small screens) */}
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 px-1 shadow-lg z-50 safe-area-pb",
        "bg-gradient-to-t from-[#0a0f14] to-[#0d1419]",
        "backdrop-blur-md border-t border-white/10"
      )}>
        {menuItems.slice(0, 5).map((it) => {
          const Icon = it.icon
          const isActive = activeTab === it.id
          return (
            <button
              key={it.id}
              onClick={() => setActiveTab(it.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all min-w-[56px]",
                isActive 
                  ? "text-teal-400 bg-teal-500/20" 
                  : "text-gray-400"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-medium truncate max-w-[48px]">
                {translate(it.labelFr, it.labelAr).split(' ')[0]}
              </span>
            </button>
          )
        })}
        {/* More menu for remaining items */}
        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all min-w-[56px]",
            activeTab === "settings"
              ? "text-teal-400 bg-teal-500/20"
              : "text-gray-400"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">{translate("Plus", "المزيد")}</span>
        </button>
      </nav>
    </>
  )
}
