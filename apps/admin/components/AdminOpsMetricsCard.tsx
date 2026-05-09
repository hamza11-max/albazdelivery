"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@albaz/ui"
import { Activity, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { apiErrorMessage } from "../lib/api-error-message"
import { useAdminI18n } from "../lib/AdminI18nProvider"

type OpsPayloadSuccess = {
  ops?: {
    generatedAt?: string
    windowHours24?: {
      stripeWebhookEventsAccepted?: number
      paymentsCreated?: number
      refundsCompleted?: number
    }
    refundsPending?: number
    vendorPayoutRowsTotal?: number
    infrastructure?: {
      stripeWebhookQueueMode?: string
      bullMqRedisConfigured?: boolean
      upstashRateLimitConfigured?: boolean
    }
  }
}

export function AdminOpsMetricsCard() {
  const { toast } = useToast()
  const { t, language } = useAdminI18n()
  const [loading, setLoading] = useState(true)
  const [ops, setOps] = useState<OpsPayloadSuccess["ops"] | null>(null)
  const locale = language === "ar" ? "ar-DZ" : "fr-FR"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ops/metrics", { credentials: "include" })
      const json = await res.json()
      if (json.success && json.data?.ops) {
        setOps(json.data.ops)
      } else {
        toast({
          title: t("opsCard.metricsTitle"),
          description: apiErrorMessage(json.error, t("opsCard.invalidResponse")),
          variant: "destructive",
        })
        setOps(null)
      }
    } catch {
      toast({ title: t("opsCard.metricsTitle"), description: t("common.networkError"), variant: "destructive" })
      setOps(null)
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !ops) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("opsCard.loading")}
        </CardContent>
      </Card>
    )
  }

  if (!ops) return null

  const w = ops.windowHours24
  const infra = ops.infrastructure

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            {t("opsCard.title")}
          </CardTitle>
          <CardDescription>
            {t("opsCard.desc")}
            {ops.generatedAt
              ? ` · ${t("opsCard.generated")} ${new Date(ops.generatedAt).toLocaleString(locale)}`
              : ""}
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh")}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{t("opsCard.webhooks24h")}</p>
          <p className="text-lg font-semibold tabular-nums">{w?.stripeWebhookEventsAccepted ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{t("opsCard.payments24h")}</p>
          <p className="text-lg font-semibold tabular-nums">{w?.paymentsCreated ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{t("opsCard.refundsDone24h")}</p>
          <p className="text-lg font-semibold tabular-nums">{w?.refundsCompleted ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{t("opsCard.refundsPending")}</p>
          <p className="text-lg font-semibold tabular-nums">{ops.refundsPending ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
          <p className="text-xs text-muted-foreground">{t("opsCard.payoutLedger")}</p>
          <p className="text-lg font-semibold tabular-nums">{ops.vendorPayoutRowsTotal ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2 space-y-1 text-xs">
          <p className="font-medium text-foreground">{t("opsCard.infrastructure")}</p>
          <p>
            {t("opsCard.webhooksLabel")} <code className="rounded bg-muted px-1">{infra?.stripeWebhookQueueMode ?? "—"}</code>
          </p>
          <p>
            {t("opsCard.redisBull")}{" "}
            {infra?.bullMqRedisConfigured ? (
              <span className="text-green-600">{t("opsCard.yes")}</span>
            ) : (
              <span className="text-amber-600">{t("opsCard.no")}</span>
            )}
            {" · "}
            {t("opsCard.upstash")}{" "}
            {infra?.upstashRateLimitConfigured ? (
              <span className="text-green-600">{t("opsCard.yes")}</span>
            ) : (
              <span className="text-amber-600">{t("opsCard.no")}</span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
