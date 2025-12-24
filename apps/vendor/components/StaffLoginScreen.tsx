"use client"

import { useState, useEffect } from "react"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/root/components/ui/card"
import { User, Lock, Loader2, AlertCircle, Store } from "lucide-react"
import type { StaffUser } from "./types"

interface StaffLoginScreenProps {
  vendorName?: string
  onStaffLogin: (staff: StaffUser) => void
  translate: (fr: string, ar: string) => string
}

export function StaffLoginScreen({ vendorName, onStaffLogin, translate }: StaffLoginScreenProps) {
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(true)

  useEffect(() => {
    // Load staff list from API or localStorage
    const loadStaff = async () => {
      try {
        // Try API first
        const res = await fetch("/api/vendor/staff", {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.staff)) {
            setStaffList(data.staff)
            setLoadingStaff(false)
            return
          }
        }
      } catch (err) {
        console.warn("[Staff] Failed to load from API, trying localStorage")
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("vendor-staff-list")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setStaffList(parsed)
          }
        }
      } catch (err) {
        console.warn("[Staff] Failed to load from localStorage")
      }
      setLoadingStaff(false)
    }

    loadStaff()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!selectedStaffId) {
      setError(translate("Sélectionnez un membre du personnel", "اختر موظفاً"))
      return
    }

    if (!password) {
      setError(translate("Entrez le mot de passe", "أدخل كلمة المرور"))
      return
    }

    setLoading(true)

    try {
      const staff = staffList.find(s => s.id === selectedStaffId)
      if (!staff) {
        setError(translate("Personnel introuvable", "الموظف غير موجود"))
        setLoading(false)
        return
      }

      // Verify password (in production, this should be hashed and checked via API)
      // For now, check against stored password or API
      const res = await fetch("/api/vendor/staff/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ staffId: selectedStaffId, password }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          // Store current staff session
          localStorage.setItem("vendor-current-staff", JSON.stringify(staff))
          onStaffLogin(staff)
          return
        }
      }

      // Fallback: check password directly (for development/local storage)
      if (staff.password === password) {
        localStorage.setItem("vendor-current-staff", JSON.stringify(staff))
        onStaffLogin(staff)
        return
      }

      setError(translate("Mot de passe incorrect", "كلمة المرور غير صحيحة"))
    } catch (err: any) {
      setError(err.message || translate("Erreur de connexion", "خطأ في تسجيل الدخول"))
    } finally {
      setLoading(false)
    }
  }

  if (loadingStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-teal-600" />
            <p className="mt-4 text-gray-600">{translate("Chargement...", "جاري التحميل...")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{vendorName || "AlBaz Vendor"}</CardTitle>
          <CardDescription>
            {translate("Sélectionnez votre profil", "اختر ملفك الشخصي")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="staff-select">
                {translate("Membre du personnel", "الموظف")}
              </Label>
              <select
                id="staff-select"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">
                  {translate("Sélectionnez un membre", "اختر موظفاً")}
                </option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({translate(
                      staff.role === "owner" ? "Propriétaire" :
                      staff.role === "manager" ? "Gestionnaire" :
                      staff.role === "cashier" ? "Caissier" : "Personnel",
                      staff.role === "owner" ? "المالك" :
                      staff.role === "manager" ? "المدير" :
                      staff.role === "cashier" ? "أمين الصندوق" : "موظف"
                    )})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-password">
                {translate("Mot de passe", "كلمة المرور")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={translate("••••••••", "••••••••")}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !selectedStaffId}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {translate("Connexion...", "جاري تسجيل الدخول...")}
                </>
              ) : (
                translate("Se connecter", "تسجيل الدخول")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

