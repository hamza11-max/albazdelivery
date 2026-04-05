"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { PasskeysTab } from "@/root/components/tabs/PasskeysTab"
import { AdminHeader } from "../../../components/AdminHeader"
import { Button } from "@albaz/ui"
import { ArrowLeft } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"

export default function AdminPasskeysPage() {
  const router = useRouter()
  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? "loading"
  const user = session?.user ?? null
  const isAuthenticated = status === "authenticated"

  const [language, setLanguage] = useState("fr")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [vendors, setVendors] = useState<UserType[]>([])

  useEffect(() => {
    if (status === "loading") return
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/login")
    }
  }, [status, isAuthenticated, user, router])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

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

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au panneau
          </Button>
          <h2 className="text-xl font-semibold">Passkeys d&apos;abonnement</h2>
        </div>
        <PasskeysTab vendors={vendors} onRefresh={fetchVendors} listLimit={200} />
      </main>
    </div>
  )
}
