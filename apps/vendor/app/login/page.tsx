"use client"

import type React from "react"
import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import Link from "next/link"
import { SHOP_TYPES, SHOP_TYPE_LABELS } from "../../config/shopTypes"
import { BRAND_MARK_SRC } from "@/lib/brand-mark"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function LoginForm() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [passkey, setPasskey] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [ownerPhone, setOwnerPhone] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [ownerPassword, setOwnerPassword] = useState("")
  const [ownerPasswordConfirm, setOwnerPasswordConfirm] = useState("")
  const [usePinLogin, setUsePinLogin] = useState(false)
  const [pin, setPin] = useState("")
  const [staffCode, setStaffCode] = useState("")
  const [setupStep, setSetupStep] = useState<"passkey" | "shoptype" | "owner" | "login">("login")
  const [isElectron, setIsElectron] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track mount status and cleanup on unmount
  useEffect(() => {
    // Set to true on mount/remount
    isMountedRef.current = true
    
    return () => {
      // Set to false on unmount
      isMountedRef.current = false
      // Clear any pending timeouts when component unmounts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, []) // Empty deps: runs on mount, cleanup on unmount

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
      } else if (errorParam === 'PENDING_APPROVAL') {
        setError("Votre compte est en attente d'approbation")
      } else {
        setError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.")
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const electron = !!(window as any)?.electronAPI?.isElectron
    setIsElectron(electron)
    if (!electron) return

    ;(window as any).electronAPI?.auth?.getSetup?.().then((result: any) => {
      if (result?.setupComplete) {
        setSetupStep("login")
      } else {
        setSetupStep("passkey")
      }
    }).catch(() => {
      setSetupStep("passkey")
    })
  }, [])

  const handleVerifyPasskey = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await (window as any).electronAPI?.auth?.verifyPasskey?.(passkey)
      if (result?.success) {
        const setup = await (window as any).electronAPI?.auth?.getSetup?.()
        if (setup?.shopTypeLocked && setup?.lockedShopType) {
          setSetupStep("owner")
        } else {
          setSetupStep("shoptype")
        }
      } else {
        setError(result?.error || "Passkey invalide")
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la vérification du passkey")
    } finally {
      setLoading(false)
    }
  }

  const handleShopTypeSelect = async (shopType: string) => {
    setError("")
    setLoading(true)
    try {
      const result = await (window as any).electronAPI?.auth?.setShopType?.(shopType)
      if (result?.success) {
        setSetupStep("owner")
      } else {
        setError(result?.error || "Erreur lors du choix du type")
      }
    } catch (err: any) {
      setError(err?.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  const handleOwnerSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (ownerPassword !== ownerPasswordConfirm) {
        setError("Les mots de passe ne correspondent pas")
        setLoading(false)
        return
      }
      const result = await (window as any).electronAPI?.auth?.setupOwner?.({
        name: ownerName,
        phone: ownerPhone,
        email: ownerEmail,
        password: ownerPassword,
      })
      if (result?.success) {
        // Auto-register owner (vendor request) via API
        if (!result?.alreadyComplete) {
          const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: ownerName,
              email: ownerEmail,
              phone: ownerPhone,
              password: ownerPassword,
              role: 'VENDOR',
              autoApprove: true,
            }),
          })
          if (!registerResponse.ok) {
            const data = await registerResponse.json().catch(() => null)
            throw new Error(data?.error?.message || data?.message || 'Registration failed')
          }
        }
        setIdentifier(ownerEmail)
        setSetupStep("login")
      } else {
        if (result?.error === 'Setup already complete') {
          setSetupStep("login")
          return
        }
        setError(result?.error || "Impossible de créer le propriétaire")
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isElectron) {
        const result = await (window as any).electronAPI?.auth?.login?.({
          identifier,
          password: usePinLogin ? undefined : password,
          pin: usePinLogin ? pin : undefined,
          staffCode: usePinLogin ? staffCode : undefined,
        })
        if (result?.success) {
          router.push('/vendor')
          router.refresh()
          setTimeout(() => {
            window.location.href = '/vendor'
          }, 100)
          return
        }
        setError(result?.error || "Email ou mot de passe incorrect")
        setLoading(false)
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[Login] Attempting login with:', { identifier })
      }
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[Login] SignIn result:', result)
      }

      if (result?.error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Login] Error:', result.error)
        }
        
        let errorMessage = "Email ou mot de passe incorrect"
        
        // Handle CredentialsSignin error - could be wrong password or pending approval
        if (result.error === 'CredentialsSignin') {
          // Since redirect: false prevents URL-based error codes, check user status via API
          try {
            const statusResponse = await fetch('/api/auth/check-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier }),
            })
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === 'PENDING') {
                errorMessage = "Votre compte est en attente d'approbation"
              } else if (statusData.status === 'REJECTED') {
                errorMessage = "Votre compte a été rejeté. Veuillez contacter le support."
              }
            }
          } catch (statusError) {
            // If status check fails, fall back to generic error
            if (process.env.NODE_ENV === 'development') {
              console.error('[Login] Status check failed:', statusError)
            }
          }
        } else {
          // For non-CredentialsSignin errors, show the error message directly
          // Note: URL parameter checks are not used here since redirect: false prevents redirects
          errorMessage = `Erreur: ${result.error}`
        }
        
        setError(errorMessage)
        setLoading(false)
      } else if (result?.ok) {
        // Success - redirect to vendor dashboard
        router.push('/vendor')
        router.refresh()
        
        // Use window.location as primary redirect method
        setTimeout(() => {
          window.location.href = '/vendor'
        }, 100)
        
        // Safety timeout: reset loading state if redirect fails after 3 seconds
        // Clear any existing timeout first
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            setLoading(false)
          }
          timeoutRef.current = null
        }, 3000)
      } else {
        setError("Une erreur s'est produite. Veuillez réessayer.")
        setLoading(false)
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', err)
      }
      setError("Une erreur s'est produite. Veuillez réessayer.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-transparent bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center bg-black p-6 text-center dark:bg-gray-900 sm:p-8">
          <img src={BRAND_MARK_SRC} alt="AlBaz" className="h-16 w-auto object-contain mb-2" />
          <p className="text-gray-300 text-sm">Vendor Dashboard</p>
        </div>

        {/* Form Section */}
        <div className="p-5 sm:p-8">
          <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-gray-100 sm:text-2xl">Connexion</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Connectez-vous à votre compte vendeur</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {isElectron && setupStep === "passkey" ? (
            <form onSubmit={handleVerifyPasskey} className="space-y-4">
              <div>
                <Label htmlFor="passkey">Passkey (16 caractères)</Label>
                <Input
                  id="passkey"
                  type="text"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="0000-0000-0000-0000"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Utilisez la clé d'abonnement fournie par l'administration.
              </p>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600"
              >
                {loading ? "Vérification..." : "Vérifier"}
              </Button>
            </form>
          ) : isElectron && setupStep === "shoptype" ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Quel type de commerce avez-vous ?
              </p>
              <p className="text-xs text-gray-500">
                Les options affichées dans l&apos;app seront adaptées à votre activité.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {SHOP_TYPES.map((id) => {
                  const labels = SHOP_TYPE_LABELS[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleShopTypeSelect(id)}
                      className="flex flex-col items-start gap-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:border-teal-400 hover:bg-teal-50 disabled:opacity-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium text-gray-800">{labels.fr}</span>
                      <span className="text-sm text-gray-500 sm:text-right">{labels.ar}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : isElectron && setupStep === "owner" ? (
            <form onSubmit={handleOwnerSetup} className="space-y-4">
              <div>
                <Label htmlFor="ownerName">Nom du propriétaire</Label>
                <Input
                  id="ownerName"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Nom complet"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ownerPhone">Téléphone</Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ownerEmail">Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ownerPassword">Mot de passe</Label>
                <Input
                  id="ownerPassword"
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ownerPasswordConfirm">Confirmer le mot de passe</Label>
                <Input
                  id="ownerPasswordConfirm"
                  type="password"
                  value={ownerPasswordConfirm}
                  onChange={(e) => setOwnerPasswordConfirm(e.target.value)}
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
                {loading ? "Création..." : "Créer le compte propriétaire"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isElectron ? (
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
              ) : (
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
              )}

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading || usePinLogin}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="usePin"
                  type="checkbox"
                  checked={usePinLogin}
                  onChange={(e) => setUsePinLogin(e.target.checked)}
                />
                <Label htmlFor="usePin">Utiliser un PIN (POS rapide)</Label>
              </div>
              {usePinLogin && (
                <div>
                  <Label htmlFor="staffCode">Code personnel</Label>
                  <Input
                    id="staffCode"
                    type="text"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="1234"
                    required
                    disabled={loading}
                    className="mt-1"
                  />
                  <Label htmlFor="pin" className="mt-3 block">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    required
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          )}

          {!isElectron && (
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Vous n'avez pas de compte ?</p>
              <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-medium">
                Créer un compte vendeur
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center">
        <div className="text-white text-lg">Chargement...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

