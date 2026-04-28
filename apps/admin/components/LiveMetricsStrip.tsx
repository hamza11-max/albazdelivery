"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@albaz/ui"
import { Activity, Clock, DollarSign, Loader2, ShoppingBag, Zap } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"

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
  const [live, setLive] = useState<LivePayload | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics/live", { credentials: "include" })
      const json = await res.json()
      if (json.success && json.data?.live) {
        setLive(json.data.live as LivePayload)
      } else if (!json.success) {
        toast({
          title: "Métriques temps réel indisponibles",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Métriques temps réel",
        description: "Erreur réseau",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

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
          Chargement des indicateurs en direct…
        </CardContent>
      </Card>
    )
  }

  if (!live) return null

  const asOf = new Date(live.asOf).toLocaleString("fr-FR")

  const items = [
    {
      label: "Actualisé à",
      value: asOf,
      icon: Clock,
      sub: `${POLL_MS / 1000}s`,
    },
    {
      label: "Commandes (1h)",
      value: live.ordersLastHour,
      icon: Zap,
      sub: "créées",
    },
    {
      label: "Commandes actives",
      value: live.activeOrders,
      icon: Activity,
      sub: "hors livré / annulé",
    },
    {
      label: "24h — créées",
      value: live.ordersLast24h,
      icon: ShoppingBag,
      sub: `${live.deliveredLast24h} livrées`,
    },
    {
      label: "CA 24h (livrées)",
      value: `${Math.round(live.revenueLast24h).toLocaleString("fr-FR")} DZD`,
      icon: DollarSign,
      sub: "sur périmètre 24h",
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
