"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { 
  Sun, 
  Moon, 
  LogOut, 
  Globe,
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  Users,
  Truck,
  BarChart3,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [isExpanded, setIsExpanded] = useState(false)

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
      id: "sales",
      icon: History,
      labelFr: "Ventes",
      labelAr: "المبيعات",
    },
    {
      id: "customers",
      icon: Users,
      labelFr: "Clients",
      labelAr: "العملاء",
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
  ]

  const handleLanguageToggle = () => {
    const newLanguage = language === "fr" ? "ar" : "fr"
    setLanguage?.(newLanguage)
  }

  const handleThemeToggle = () => {
    setIsDarkMode?.(!isDarkMode)
  }

  return (
    <aside 
      className="fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg z-50 flex flex-col items-center py-4 transition-all duration-300 hidden md:flex"
      style={{ width: isExpanded ? '16rem' : '5rem' }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className="mb-6 px-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center shadow-lg">
          <img src="/logo.png" alt="AL-baz" className="h-8 w-auto" />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 w-full space-y-2 px-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const label = translate(item.labelFr, item.labelAr)

          return (
            <div
              key={item.id}
              className="relative"
            >
              <button
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden group/item",
                  isActive
                    ? "bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gradient-to-br hover:from-teal-50 hover:via-cyan-50 hover:to-orange-50 hover:text-teal-700"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all",
                  isActive 
                    ? "bg-white/20" 
                    : "bg-gray-100 group-hover/item:bg-gradient-to-br group-hover/item:from-teal-100 group-hover/item:to-orange-100"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-gray-600 group-hover/item:text-teal-600"
                  )} />
                </div>

                {/* Label - slides in on hover */}
                <span
                  className={cn(
                    "font-medium whitespace-nowrap transition-all duration-300 ease-out",
                    isExpanded
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-4 w-0 overflow-hidden"
                  )}
                >
                  {label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                )}
              </button>
            </div>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="w-full space-y-2 px-2 border-t border-gray-200 pt-4">
        {/* Language Toggle */}
        <div className="relative">
          <button
            onClick={handleLanguageToggle}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-br hover:from-teal-50 hover:via-cyan-50 hover:to-orange-50 hover:text-teal-700 transition-all duration-200 group/item"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 group-hover/item:bg-gradient-to-br group-hover/item:from-teal-100 group-hover/item:to-orange-100 transition-all">
              <Globe className="w-5 h-5 text-gray-600 group-hover/item:text-teal-600 transition-colors" />
            </div>
            <span
              className={cn(
                "font-medium whitespace-nowrap transition-all duration-300 ease-out",
                isExpanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4 w-0 overflow-hidden"
              )}
            >
              {translate("Langue", "اللغة")}
            </span>
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="relative">
          <button
            onClick={handleThemeToggle}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-br hover:from-teal-50 hover:via-cyan-50 hover:to-orange-50 hover:text-teal-700 transition-all duration-200 group/item"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 group-hover/item:bg-gradient-to-br group-hover/item:from-teal-100 group-hover/item:to-orange-100 transition-all">
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-600 group-hover/item:text-teal-600 transition-colors" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 group-hover/item:text-teal-600 transition-colors" />
              )}
            </div>
            <span
              className={cn(
                "font-medium whitespace-nowrap transition-all duration-300 ease-out",
                isExpanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4 w-0 overflow-hidden"
              )}
            >
              {translate(isDarkMode ? "Mode clair" : "Mode sombre", isDarkMode ? "الوضع الفاتح" : "الوضع الداكن")}
            </span>
          </button>
        </div>

        {/* Logout */}
        <div className="relative">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 group/item"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 group-hover/item:bg-red-200 transition-all">
              <LogOut className="w-5 h-5 text-red-600 transition-colors" />
            </div>
            <span
              className={cn(
                "font-medium whitespace-nowrap transition-all duration-300 ease-out",
                isExpanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4 w-0 overflow-hidden"
              )}
            >
              {translate("Déconnexion", "تسجيل الخروج")}
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}

