"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@albaz/ui"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useErrorHandler } from "../../../hooks/use-error-handler"
import { normalizeAlgerianPhone } from "../../../lib/phone"

export const dynamic = "force-dynamic"

export default function EditProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { handleError } = useErrorHandler()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "")
      setPhone(normalizeAlgerianPhone(session.user.phone) ?? "")
      setAddress((session.user as { address?: string }).address ?? "")
      setCity((session.user as { city?: string }).city ?? "")
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user && !loading) {
      setLoading(true)
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            setName(data.profile.name ?? "")
            setPhone(normalizeAlgerianPhone(data.profile.phone) ?? "")
            setAddress(data.profile.address ?? "")
            setCity(data.profile.city ?? "")
          }
        })
        .catch((err) => handleError(err, { showToast: true }))
        .finally(() => setLoading(false))
    }
  }, [session?.user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedPhone = normalizeAlgerianPhone(phone)
    if (!/^0[567]\d{8}$/.test(normalizedPhone)) {
      handleError(new Error("Numéro de téléphone invalide (ex: 0555000000)"), { showToast: true })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: normalizedPhone,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push("/")
        router.refresh()
      } else {
        handleError(new Error(data.error?.message || "Erreur lors de la mise à jour"), { showToast: true })
      }
    } catch (err) {
      handleError(err as Error, { showToast: true })
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4d1a]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Modifier le profil</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0555000000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rue, numéro, quartier..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Alger, Oran..."
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#1a4d1a] hover:bg-[#1a5d1a]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
