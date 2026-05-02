"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@albaz/ui"
import { ArrowLeft, Loader2 } from "lucide-react"
import { paymentsAPI } from "../../../lib/api-client"
import { useErrorHandler } from "../../../hooks/use-error-handler"
import { useProfileI18n } from "../../../hooks/use-profile-i18n"
import { formatPaymentMethod, formatPaymentStatus } from "../../../lib/profile-display-labels"

export const dynamic = "force-dynamic"

type PaymentRow = {
  id: string
  amount?: number
  status?: string
  method?: string
  createdAt?: string
  order?: { id?: string; total?: number; store?: { name?: string } }
}

export default function PaymentsHistoryPage() {
  const router = useRouter()
  const t = useProfileI18n()
  const { status } = useSession()
  const { handleError } = useErrorHandler()
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    setLoading(true)
    paymentsAPI
      .getHistory()
      .then((r: { success?: boolean; data?: { payments?: PaymentRow[] } }) => {
        if (r.success && Array.isArray(r.data?.payments)) setRows(r.data!.payments!)
        else setRows([])
      })
      .catch((e) => {
        handleError(e as Error, { showToast: true })
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [status, handleError])

  if (status === "loading" || (loading && status === "authenticated" && rows.length === 0)) {
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
          <h1 className="text-lg font-semibold">{t("pay-h1", "Paiements", "المدفوعات", "Payments")}</h1>
        </div>
      </header>

      <div className="container max-w-lg mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("pay-history", "Historique", "السجل", "History")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {rows.length === 0 ? (
              <p className="text-muted-foreground">
                {t("pay-none", "Aucun paiement enregistré.", "لا مدفوعات.", "No payments on file.")}
              </p>
            ) : (
              rows.map((p) => (
                <div key={p.id} className="border-b border-border pb-3">
                  <div className="flex justify-between">
                    <span className="font-mono text-xs">{p.order?.id?.slice(0, 12)}…</span>
                    <span className="tabular-nums font-medium">{p.amount ?? "—"} DZD</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatPaymentStatus(t, p.status)} · {formatPaymentMethod(t, p.method)} · {p.order?.store?.name} ·{' '}
                    {p.createdAt?.slice(0, 19)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
