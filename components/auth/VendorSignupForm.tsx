"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitRegistrationRequest } from "@/root/lib/auth/register-client"

const VENDOR_SHOP_TYPES: { value: string; label: string }[] = [
  { value: "restaurant", label: "Restaurant / Café" },
  { value: "retail", label: "Commerce (détail)" },
  { value: "grocery", label: "Épicerie / Supermarché" },
  { value: "other", label: "Autre" },
]

export interface VendorSignupFormProps {
  loginHref?: string
  registerPath?: string
  onSuccess?: (result: { autoApproved?: boolean; pendingApproval?: boolean }) => void
  onError?: (message: string) => void
  className?: string
}

export function VendorSignupForm({
  loginHref = "/login",
  registerPath = "/api/auth/register",
  onSuccess,
  onError,
  className,
}: VendorSignupFormProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [shopType, setShopType] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      onError?.("Les mots de passe ne correspondent pas")
      return
    }
    if (!shopType) {
      onError?.("Veuillez sélectionner un type de magasin")
      return
    }

    setLoading(true)
    try {
      const result = await submitRegistrationRequest(
        {
          role: "VENDOR",
          name,
          email,
          phone,
          password,
          shopType,
          photoUrl: photoUrl || undefined,
        },
        {
          registerPath,
          registrationChannel: "web",
        }
      )

      if (!result.success) {
        onError?.(result.error || "Impossible de soumettre la demande")
        return
      }

      const data = result.data as {
        autoApproved?: boolean
        pendingApproval?: boolean
      } | undefined
      onSuccess?.({
        autoApproved: data?.autoApproved === true,
        pendingApproval: data?.pendingApproval === true,
      })
    } catch {
      onError?.("Impossible de soumettre la demande")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className ?? "space-y-4"}>
      <Field id="name" label="Nom complet / Nom de l'entreprise">
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>
      <Field id="phone" label="Numéro de téléphone">
        <Input
          id="phone"
          type="tel"
          placeholder="05XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </Field>
      <Field id="email" label="Adresse email">
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      <Field id="password" label="Mot de passe">
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Field id="confirmPassword" label="Confirmer le mot de passe">
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </Field>
      <Field id="shopType" label="Type de magasin">
        <Select value={shopType} onValueChange={setShopType} required>
          <SelectTrigger id="shopType">
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent>
            {VENDOR_SHOP_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="photo" label="Logo du magasin (URL, optionnel)">
        <Input
          id="photo"
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Envoi…" : "Soumettre pour approbation"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href={loginHref} className="text-primary hover:underline">
          Déjà un compte ? Se connecter
        </Link>
      </p>
    </form>
  )
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
