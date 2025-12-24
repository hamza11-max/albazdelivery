"use client"

import { useState, useEffect } from "react"
import { Button } from "@/root/components/ui/button"
import { LogOut, User, Store, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/root/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { StaffUser } from "./types"

interface VendorHeaderProps {
  vendorName?: string
  currentStaff?: StaffUser | null
  onRoleChange?: () => void
  translate: (fr: string, ar: string) => string
}

export function VendorHeader({ vendorName, currentStaff, onRoleChange, translate }: VendorHeaderProps) {
  const router = useRouter()
  const [shopInfo, setShopInfo] = useState<{ name?: string; logo?: string }>({})

  useEffect(() => {
    // Load shop info
    try {
      const stored = localStorage.getItem("vendor-shop-info")
      if (stored) {
        const parsed = JSON.parse(stored)
        setShopInfo(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleLogout = async () => {
    // Clear staff session
    localStorage.removeItem("vendor-current-staff")
    
    // Sign out from NextAuth
    await signOut({ redirect: false })
    
    // Redirect to login
    router.push("/login")
    router.refresh()
  }

  const getRoleLabel = (role?: string) => {
    if (!role) return translate("Non défini", "غير محدد")
    switch (role) {
      case "owner":
        return translate("Propriétaire", "المالك")
      case "manager":
        return translate("Gestionnaire", "المدير")
      case "cashier":
        return translate("Caissier", "أمين الصندوق")
      case "staff":
        return translate("Personnel", "موظف")
      default:
        return role
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-cyan-500 overflow-hidden">
            {shopInfo.logo ? (
              <img src={shopInfo.logo} alt={shopInfo.name || "Logo"} className="h-8 w-8 rounded object-contain" />
            ) : (
              <img 
                src="/logo.svg" 
                alt="AlBaz Logo" 
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  // Fallback to Store icon if logo not found
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const storeIcon = document.createElement('div')
                    storeIcon.className = 'fallback-icon'
                    storeIcon.innerHTML = '<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>'
                    parent.appendChild(storeIcon)
                  }
                }}
              />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold">{shopInfo.name || vendorName || "AlBaz Vendor"}</h1>
            {currentStaff && (
              <p className="text-xs text-muted-foreground">
                {currentStaff.name} • {getRoleLabel(currentStaff.role)}
              </p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Role Change Button (if owner/manager) */}
          {(currentStaff?.role === "owner" || currentStaff?.role === "manager") && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRoleChange}
              className="hidden sm:flex"
            >
              <User className="h-4 w-4 mr-2" />
              {translate("Changer de rôle", "تغيير الدور")}
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{currentStaff?.name || translate("Utilisateur", "المستخدم")}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{currentStaff?.name || translate("Utilisateur", "المستخدم")}</p>
                  <p className="text-xs text-muted-foreground">{currentStaff?.email || ""}</p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(currentStaff?.role)}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(currentStaff?.role === "owner" || currentStaff?.role === "manager") && (
                <>
                  <DropdownMenuItem onClick={onRoleChange}>
                    <User className="mr-2 h-4 w-4" />
                    {translate("Changer de rôle", "تغيير الدور")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                {translate("Déconnexion", "تسجيل الخروج")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Button (mobile) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="sm:hidden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

