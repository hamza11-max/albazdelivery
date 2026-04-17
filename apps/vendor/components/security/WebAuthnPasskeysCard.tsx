"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Badge } from "@/root/components/ui/badge"
import { KeyRound, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react"
import {
  buildRegistrationCreationOptions,
  serializeRegistrationCredential,
  supportsWebAuthnInBrowser,
} from "../../lib/webauthn-browser"

interface WebAuthnPasskeysCardProps {
  translate: (fr: string, ar: string) => string
}

interface CredentialRow {
  id: string
  credentialId: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED"
  nickname: string | null
  deviceType: string | null
  transports: string[]
  createdAt: string
  approvedAt: string | null
  revokedAt: string | null
  lastUsedAt: string | null
}

export function WebAuthnPasskeysCard({ translate }: WebAuthnPasskeysCardProps) {
  const passkeyFeatureEnabled =
    String(process.env.NEXT_PUBLIC_ALBAZ_FEATURE_WEBAUTHN_PASSKEYS || "").toLowerCase() === "true"
  const [credentials, setCredentials] = useState<CredentialRow[]>([])
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const webAuthnSupported = useMemo(() => supportsWebAuthnInBrowser(), [])

  const loadCredentials = useCallback(async () => {
    if (!passkeyFeatureEnabled) {
      setCredentials([])
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/auth/passkeys/me", {
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Unable to load passkeys")
      }
      setCredentials(data.data?.credentials || [])
    } catch (err: any) {
      setError(err?.message || translate("Impossible de charger les passkeys", "تعذر تحميل مفاتيح المرور"))
    } finally {
      setLoading(false)
    }
  }, [passkeyFeatureEnabled, translate])

  useEffect(() => {
    loadCredentials()
  }, [loadCredentials])

  const handleEnroll = async () => {
    if (!passkeyFeatureEnabled) {
      setError(translate("La fonctionnalité passkey est désactivée.", "ميزة مفتاح المرور معطلة."))
      return
    }
    if (!webAuthnSupported || !window.PublicKeyCredential) {
      setError(translate("Ce navigateur ne prend pas en charge WebAuthn", "هذا المتصفح لا يدعم WebAuthn"))
      return
    }

    try {
      setEnrolling(true)
      setError(null)

      const optionsRes = await fetch("/api/auth/passkeys/register/options", {
        method: "POST",
        credentials: "include",
      })
      const optionsData = await optionsRes.json()
      if (!optionsRes.ok || !optionsData?.success) {
        throw new Error(optionsData?.error?.message || "Failed to start passkey registration")
      }

      const challengeId = optionsData.data.challengeId as string
      const credential = (await navigator.credentials.create(
        buildRegistrationCreationOptions(optionsData.data.options),
      )) as PublicKeyCredential | null

      if (!credential) {
        throw new Error(translate("Inscription passkey annulée", "تم إلغاء تسجيل مفتاح المرور"))
      }

      const verifyRes = await fetch("/api/auth/passkeys/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId,
          credential: serializeRegistrationCredential(credential),
          nickname: `${navigator.platform || "Device"} passkey`,
        }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData?.success) {
        throw new Error(verifyData?.error?.message || "Failed to save passkey")
      }

      await loadCredentials()
    } catch (err: any) {
      setError(err?.message || translate("Échec de l'inscription passkey", "فشل تسجيل مفتاح المرور"))
    } finally {
      setEnrolling(false)
    }
  }

  const handleRemove = async (credentialId: string) => {
    try {
      setRemovingId(credentialId)
      setError(null)
      const response = await fetch(`/api/auth/passkeys/me/${credentialId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Failed to revoke passkey")
      }
      await loadCredentials()
    } catch (err: any) {
      setError(err?.message || translate("Impossible de révoquer ce passkey", "تعذر إلغاء مفتاح المرور"))
    } finally {
      setRemovingId(null)
    }
  }

  const statusBadge = (status: CredentialRow["status"]) => {
    if (status === "APPROVED") return <Badge>{translate("Approuvé", "موافق عليه")}</Badge>
    if (status === "PENDING") return <Badge variant="secondary">{translate("En attente", "قيد الانتظار")}</Badge>
    if (status === "REJECTED") return <Badge variant="destructive">{translate("Rejeté", "مرفوض")}</Badge>
    return <Badge variant="outline">{translate("Révoqué", "ملغى")}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          {translate("Passkeys WebAuthn", "مفاتيح WebAuthn")}
        </CardTitle>
        <CardDescription>
          {translate(
            "Enrôlez vos appareils et attendez l'approbation de l'administrateur avant de vous connecter avec passkey.",
            "سجّل أجهزتك وانتظر موافقة المشرف قبل تسجيل الدخول بمفتاح المرور.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!passkeyFeatureEnabled && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
            {translate(
              "La fonctionnalité passkey est désactivée par configuration.",
              "ميزة مفتاح المرور معطلة في الإعدادات.",
            )}
          </div>
        )}
        {!webAuthnSupported && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            {translate(
              "Votre navigateur/appareil ne prend pas en charge WebAuthn.",
              "متصفحك/جهازك لا يدعم WebAuthn.",
            )}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleEnroll} disabled={!passkeyFeatureEnabled || !webAuthnSupported || enrolling}>
            {enrolling
              ? translate("Enrôlement...", "جاري التسجيل...")
              : translate("Enrôler un nouveau passkey", "تسجيل مفتاح مرور جديد")}
          </Button>
          <Button variant="outline" onClick={loadCredentials} disabled={loading}>
            {loading ? translate("Chargement...", "جاري التحميل...") : translate("Rafraîchir", "تحديث")}
          </Button>
        </div>

        <div className="space-y-2">
          {credentials.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {translate("Aucun passkey enregistré.", "لا توجد مفاتيح مرور مسجلة.")}
            </p>
          )}
          {credentials.map((credential) => (
            <div
              key={credential.id}
              className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {credential.status === "APPROVED" ? (
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="font-medium">
                    {credential.nickname || translate("Passkey sans nom", "مفتاح مرور بدون اسم")}
                  </span>
                  {statusBadge(credential.status)}
                </div>
                <p className="font-mono text-xs text-muted-foreground">{credential.credentialId}</p>
                <p className="text-xs text-muted-foreground">
                  {translate("Créé le", "تاريخ الإنشاء")} {new Date(credential.createdAt).toLocaleString()}
                  {credential.approvedAt
                    ? ` • ${translate("Approuvé le", "تمت الموافقة في")} ${new Date(credential.approvedAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={removingId === credential.id}
                onClick={() => handleRemove(credential.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {translate("Révoquer", "إلغاء")}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
