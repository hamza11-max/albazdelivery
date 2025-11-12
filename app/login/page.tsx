"use client"

import type React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="min-h-screen bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="ALBAZ FAST DELIVERY" className="h-[168px] w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">{isSignUp ? "Créer un compte" : "Bienvenue sur AL-baz"}</CardTitle>
          <CardDescription>
            {isSignUp ? "Inscrivez-vous pour commencer" : "Connectez-vous pour continuer"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSignUp ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email ou téléphone</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="ex: contact@exemple.com ou 0550123456"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-orange-500 text-white"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Vous serez redirigé vers le formulaire d'inscription</p>
              <Button
                onClick={() => (window.location.href = "/signup")}
                className="w-full bg-gradient-to-r from-primary to-orange-500 text-white"
              >
                Continuer vers l'inscription
              </Button>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Vous avez déjà un compte? Se connecter" : "Pas de compte? S'inscrire"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
