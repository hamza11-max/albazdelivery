"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle error query parameter from NextAuth redirects
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      // Clear the error query parameter from URL to prevent loops
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Handle different error types
      if (errorParam === 'MissingCSRF') {
        setError("Erreur de sécurité. Veuillez actualiser la page et réessayer.")
      } else if (errorParam === 'Configuration') {
        setError("Erreur de configuration. Veuillez contacter le support.")
      } else {
        setError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.")
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Use Next-Auth's client-side signIn function
      // This properly handles session creation and cookie setting
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false, // Don't redirect automatically, we'll handle it
      })

      console.log('[Login] SignIn result:', result)

      if (result?.error) {
        // Authentication failed
        console.error('[Login] Failed:', result.error)
        setError(result.error === 'CredentialsSignin' 
          ? "Email ou mot de passe incorrect" 
          : "Une erreur s'est produite. Veuillez réessayer.")
        setLoading(false)
      } else if (result?.ok) {
        // Success - session is now established
        console.log('[Login] Success - redirecting to home')
        // Use router.push and then refresh to ensure session is loaded
        router.push('/')
        router.refresh()
        // Also do a full reload after a short delay to ensure everything is synced
        setTimeout(() => {
          window.location.href = '/'
        }, 100)
      } else {
        // Unexpected result
        console.error('[Login] Unexpected result:', result)
        setError("Une erreur s'est produite. Veuillez réessayer.")
        setLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError("Une erreur s'est produite. Veuillez réessayer.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Logo Section */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6">
          <div className="mb-4">
            <img src="/logo.png" alt="AL-BAZ FAST DELIVERY" className="h-20 w-auto" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-1 tracking-tight">
              AL-BAZ
            </h1>
            <p className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold">
              FAST DELIVERY
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 pb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Bienvenue sur AL-baz
            </h2>
            <p className="text-sm text-gray-600">
              Connectez-vous pour continuer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="identifier"
                type="email"
                placeholder="votre@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg bg-white"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 py-2 px-3 rounded-lg">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-teal-700 to-orange-500 hover:from-teal-800 hover:to-orange-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
            >
              Pas de compte? <span className="font-medium">S'inscrire</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
