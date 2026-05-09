"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@albaz/ui"
import { Activity, Clock, DollarSign, Loader2, ShoppingBag, Zap } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { useAdminI18n } from "../lib/AdminI18nProvider"

type LivePayload = {
  asOf: string
  ordersLast24h: number
  deliveredLast24h: number
  revenueLast24h: number
  activeOrders: number
  ordersLastHour: number
}

const POLL_MS = 30_000

export function LiveMetricsStrip() {
  const { toast } = useToast()
  const { t, language } = useAdminI18n()
  const [live, setLive] = useState<LivePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const locale = language === "ar" ? "ar-DZ" : "fr-FR"

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics/live", { credentials: "include" })
      const json = await res.json()
      if (json.success && json.data?.live) {
        setLive(json.data.live as LivePayload)
      } else if (!json.success) {
        toast({
          title: t("liveMetrics.unavailable"),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: t("liveMetrics.titleShort"),
        description: t("common.networkError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    fetchLive()
    const id = window.setInterval(fetchLive, POLL_MS)
    return () => window.clearInterval(id)
  }, [fetchLive])

  if (loading && !live) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("liveMetrics.loading")}
        </CardContent>
      </Card>
    )
  }

  if (!live) return null

  const asOf = new Date(live.asOf).toLocaleString(locale)

  const items = [
    {
      label: t("liveMetrics.updatedAt"),
      value: asOf,
      icon: Clock,
      sub: `${POLL_MS / 1000}s`,
    },
    {
      label: t("liveMetrics.orders1h"),
      value: live.ordersLastHour,
      icon: Zap,
      sub: t("liveMetrics.created"),
    },
    {
      label: t("liveMetrics.activeOrders"),
      value: live.activeOrders,
      icon: Activity,
      sub: t("liveMetrics.activeOrdersSub"),
    },
    {
      label: t("liveMetrics.created24h"),
      value: live.ordersLast24h,
      icon: ShoppingBag,
      sub: t("liveMetrics.delivered24hSub", undefined, undefined, { n: String(live.deliveredLast24h) }),
    },
    {
      label: t("liveMetrics.ca24h"),
      value: `${Math.round(live.revenueLast24h).toLocaleString(locale)} DZD`,
      icon: DollarSign,
      sub: t("liveMetrics.ca24hSub"),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="border-primary/15">
          <CardContent className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</span>
              <item.icon className="h-4 w-4 text-primary/70" aria-hidden />
            </div>
            <span className="text-lg font-semibold tabular-nums">{item.value}</span>
            {item.sub && <span className="text-xs text-muted-foreground">{item.sub}</span>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
