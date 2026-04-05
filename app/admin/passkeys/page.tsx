"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { PasskeysTab } from "@/components/tabs/PasskeysTab"
import type { User as UserType } from "@/lib/types"
import { ArrowLeft, Globe, LogOut, Moon, Sun } from "lucide-react"

export default function AdminPasskeysPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const isAuthenticated = status === "authenticated"
  const [language, setLanguage] = useState("fr")
  const [mounted, setMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [vendors, setVendors] = useState<UserType[]>([])

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("albaz-theme") || "system"
      const storedLang = localStorage.getItem("albaz-language") || "fr"
      setLanguage(storedLang)
      const isDark =
        storedTheme === "dark" ||
        (storedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      setIsDarkMode(isDark)
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/login")
    }
  }, [status, isAuthenticated, user, router])

  useEffect(() => {
    if (!mounted) return
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
      document.documentElement.style.colorScheme = "dark"
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
    }
  }, [isDarkMode, mounted])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.lang = language
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    if (language === "ar") {
      document.documentElement.classList.add("rtl")
    } else {
      document.documentElement.classList.remove("rtl")
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("albaz-language", language)
    }
  }, [language, mounted])

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/admin/users", { credentials: "include" })
      const data = await response.json()
      const users = data?.data?.users ?? []
      setVendors(users.filter((u: UserType) => u.role.toLowerCase() === "vendor"))
    } catch {
      setVendors([])
    }
  }

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchVendors()
    }
  }, [user?.role])

  const translate = (fr: string, ar: string) => (language === "ar" ? ar : fr)

  const Header = () => (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 shrink-0"
              onClick={() => router.push("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {translate("Panneau", "لوحة التحكم")}
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">
                {translate("Passkeys d'abonnement", "مفاتيح الاشتراك")}
              </h1>
              <p className="text-xs text-white/80 truncate">AL-baz Delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <PasskeysTab translate={translate} vendors={vendors} onRefresh={fetchVendors} listLimit={200} />
      </main>
    </div>
  )
}
