"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { signIn }: any = await import("next-auth/react")
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
        callbackUrl: "/",
      })

      if (result && typeof result === 'object' && 'error' in result) {
        const res = result as { error?: string }
        if (res.error) {
          setError("Email ou mot de passe incorrect")
          setLoading(false)
          return
        }
      }

      router.push('/')
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_15%_20%,#0ea5e9,transparent_25%),radial-gradient(circle_at_85%_15%,#f97316,transparent_25%),linear-gradient(135deg,#0ea5e9_0%,#f97316_65%,#ef5b00_100%)]">
      <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl px-10 py-12 flex flex-col items-center">
        <div className="mb-10 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="ALBAZ"
            className="h-8 w-auto mb-6"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='36' viewBox='0 0 120 36'%3E%3Crect width='120' height='36' rx='10' fill='%232f5b2f'/%3E%3Ctext x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Inter,Arial' font-size='12' font-weight='700'%3EALBAZ%3C/text%3E%3C/svg%3E"
            }}
          />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Bienvenue sur AL-baz</h2>
          <p className="text-sm text-gray-500">Connectez-vous pour continuer</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-gray-700 font-medium">Email</Label>
            <Input
              id="identifier"
              type="email"
              placeholder="votre@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-12 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/30"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/30"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button
            type="submit"
            className="w-full h-12 rounded-lg text-white font-semibold bg-gradient-to-r from-[#0ea5e9] via-[#23b67f] to-[#f97316] shadow-lg hover:brightness-95 transition-all"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  )
}
