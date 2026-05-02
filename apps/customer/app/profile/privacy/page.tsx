"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@albaz/ui"
import { ArrowLeft, Download, Loader2, ShieldAlert } from "lucide-react"
import { fetchWithCsrf } from "../../../lib/utils/csrf-client"
import { useErrorHandler } from "../../../hooks/use-error-handler"
import { useProfileI18n } from "../../../hooks/use-profile-i18n"

export const dynamic = "force-dynamic"

export default function PrivacyPage() {
  const router = useRouter()
  const t = useProfileI18n()
  const { status } = useSession()
  const { handleError } = useErrorHandler()
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const downloadExport = async () => {
    setDownloading(true)
    try {
      const res = await fetch("/api/user/data-export", { credentials: "include" })
      const json = await res.json()
      if (!json.success)
        throw new Error(
          json.error?.message ||
            json.error ||
            t("export-denied", "Export refusé", "رفض التصدير", "Export denied"),
        )
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `albaz-data-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      handleError(e as Error, { showToast: true })
    } finally {
      setDownloading(false)
    }
  }

  const anonymizeAccount = async () => {
    if (
      !confirm(
        t(
          "anon-confirm1",
          "Cette action est irréversible : vos identifiants de connexion ne fonctionneront plus. Continuer ?",
          "هذا الإجراء لا رجعة فيه: لن تعمل بيانات تسجيل الدخول بعد الآن. المتابعة؟",
          "This cannot be undone: your login will stop working. Continue?",
        ),
      )
    )
      return
    if (
      !confirm(
        t(
          "anon-confirm2",
          "Dernière confirmation : anonymiser le compte ?",
          "تأكيد أخير: إخفاء هوية الحساب؟",
          "Final confirmation: anonymize your account?",
        ),
      )
    )
      return
    setDeleting(true)
    try {
      const res = await fetchWithCsrf("/api/user/account/anonymize", { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || t("anon-fail", "Échec", "فشل", "Failed"))
      }
      await signOut({ callbackUrl: "/" })
    } catch (e) {
      handleError(e as Error, { showToast: true })
      setDeleting(false)
    }
  }

  if (status === "loading") {
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
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">
            {t("privacy-title", "Données & confidentialité", "البيانات والخصوصية", "Data & privacy")}
          </h1>
        </div>
      </header>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t("export-title", "Exporter mes données", "تصدير بياناتي", "Export my data")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t(
                "export-desc",
                "Téléchargez une copie JSON de vos informations (sans mot de passe). Voir la politique de confidentialité pour le cadre légal.",
                "حمّل نسخة JSON من معلوماتك (بدون كلمة المرور). راجع سياسة الخصوصية للإطار القانوني.",
                "Download a JSON copy of your information (no password). See the privacy policy for legal context.",
              )}
            </p>
            <Button type="button" className="w-full" disabled={downloading} onClick={() => void downloadExport()}>
              {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              {t("export-btn", "Télécharger JSON", "تحميل JSON", "Download JSON")}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-4 w-4" />
              {t(
                "anon-title",
                "Fermer le compte (anonymisation)",
                "إغلاق الحساب (إخفاء الهوية)",
                "Close account (anonymization)",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t(
                "anon-desc",
                "Les commandes peuvent être conservées à des fins légales. Les données personnelles du compte sont effacées pour la connexion. Les comptes administrateurs ne peuvent pas utiliser ce flux.",
                "قد تُحفَظ الطلبات لأسباب قانونية. تُمسح البيانات الشخصية للحساب من ناحية تسجيل الدخول. لا يمكن لحسابات المشرفين استخدام هذا المسار.",
                "Orders may be kept for legal reasons. Account personal data used for login is removed. Admin accounts cannot use this flow.",
              )}
            </p>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={deleting}
              onClick={() => void anonymizeAccount()}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("anon-btn", "Anonymiser mon compte", "إخفاء هوية حسابي", "Anonymize my account")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
