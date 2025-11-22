"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import Link from "next/link"

// Force dynamic rendering
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
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
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
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error === 'CredentialsSignin' 
          ? "Email ou mot de passe incorrect" 
          : "Une erreur s'est produite. Veuillez réessayer.")
        setLoading(false)
      } else if (result?.ok) {
        // Success - redirect to vendor dashboard
        router.push('/vendor')
        router.refresh()
        setTimeout(() => {
          window.location.href = '/vendor'
        }, 100)
      } else {
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
        <div className="bg-gradient-to-r from-teal-600 to-cyan-500 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">AL-baz</h1>
          <p className="text-teal-100">Vendor Dashboard</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connexion</h2>
          <p className="text-gray-600 mb-6">Connectez-vous à votre compte vendeur</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="identifier">Email ou Téléphone</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@example.com ou 0551234567"
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Vous n'avez pas de compte ?</p>
            <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-medium">
              Créer un compte vendeur
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

