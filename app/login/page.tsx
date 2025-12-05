"use client"

import type React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
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

      // If signIn didn't return an error, navigate to home
      router.push('/')
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-500 to-orange-500 flex items-center justify-center p-4">
      {/* White Card Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-teal-700 tracking-tight">
              <span className="inline-block">AL</span>
              <span className="inline-block relative">
                BAZ
                <svg className="absolute -top-2 -right-2 w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </span>
            </h1>
          </div>
          <p className="text-sm text-gray-600 font-medium">FAST DELIVERY</p>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenue sur AL-baz</h2>
          <p className="text-sm text-gray-500">Connectez-vous pour continuer</p>
        </div>

        {/* Form */}
        {!isSignUp ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="votre@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="border-gray-300 rounded-lg h-12"
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
                className="border-gray-300 rounded-lg h-12"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-teal-600 to-orange-500 text-white font-bold rounded-lg h-12 hover:from-teal-700 hover:to-orange-600 transition-all"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">Vous serez redirigé vers le formulaire d'inscription</p>
            <Button
              onClick={() => (window.location.href = "/signup")}
              className="w-full bg-gradient-to-r from-teal-600 to-orange-500 text-white font-bold rounded-lg h-12 hover:from-teal-700 hover:to-orange-600 transition-all"
            >
              Continuer vers l'inscription
            </Button>
          </div>
        )}

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isSignUp ? "Vous avez déjà un compte? Se connecter" : "Pas de compte? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  )
}
