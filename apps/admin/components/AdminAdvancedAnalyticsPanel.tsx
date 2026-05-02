"use client"

import { useEffect, useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@albaz/ui"
import { LineChart as LineChartIcon, Loader2 } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

type Zone = { id: string; name: string; city?: string | null }
type Vendor = { id: string; name: string; email: string }

type DemandBlock = {
  zoneId?: string
  predictedDemand?: number
  peakHours?: number[]
  weatherImpact?: number
  eventImpact?: number
}

type PricingRow = { hour: number; multiplier: number; reason: string }

type InsightsBlock = {
  totalCustomers?: number
  repeatCustomers?: number
  repeatRate?: number
  topCustomers?: Array<{
    customerId: string
    customerName: string
    orderCount: number
    totalSpent: number
  }>
}

type ForecastBlock = {
  period?: string
  predictedSales?: number
  confidence?: number
  trend?: string
  avgDailyRevenue?: number
  historicalOrders?: number
}

export function AdminAdvancedAnalyticsPanel() {
  const { toast } = useToast()
  const [zones, setZones] = useState<Zone[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [zoneId, setZoneId] = useState("")
  const [vendorId, setVendorId] = useState("")
  const [forecastPeriod, setForecastPeriod] = useState<"week" | "month">("week")
  const [predDate, setPredDate] = useState(() => new Date().toISOString().slice(0, 10))

  const [demand, setDemand] = useState<DemandBlock | null>(null)
  const [pricing, setPricing] = useState<PricingRow[]>([])
  const [demandDisclaimer, setDemandDisclaimer] = useState<string | null>(null)
  const [insights, setInsights] = useState<InsightsBlock | null>(null)
  const [forecast, setForecast] = useState<ForecastBlock | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const [showDemandJson, setShowDemandJson] = useState(false)
  const [showInsightsJson, setShowInsightsJson] = useState(false)
  const [showForecastJson, setShowForecastJson] = useState(false)
  const [rawDemand, setRawDemand] = useState<string | null>(null)
  const [rawInsights, setRawInsights] = useState<string | null>(null)
  const [rawForecast, setRawForecast] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [z, v] = await Promise.all([
          fetch("/api/admin/delivery-zones", { credentials: "include" }),
          fetch("/api/admin/users?role=VENDOR&status=APPROVED&limit=200", { credentials: "include" }),
        ])
        const [zj, vj] = await Promise.all([z.json(), v.json()])
        if (zj.success && Array.isArray(zj.data?.zones)) {
          const list = zj.data.zones as Zone[]
          setZones(list)
          setZoneId((prev) => prev || list[0]?.id || "")
        }
        if (vj.success && Array.isArray(vj.data?.users)) {
          const list = (vj.data.users as Vendor[]).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          }))
          setVendors(list)
          setVendorId((prev) => prev || list[0]?.id || "")
        }
      } catch {
        toast({ title: "Chargement sélecteurs", variant: "destructive" })
      }
    })()
  }, [toast])

  const fetchDemand = async () => {
    if (!zoneId) {
      toast({ title: "Choisir une zone", variant: "destructive" })
      return
    }
    setLoading("demand")
    setDemand(null)
    setPricing([])
    setDemandDisclaimer(null)
    setRawDemand(null)
    try {
      const params = new URLSearchParams({ zoneId, date: predDate })
      const res = await fetch(`/api/analytics/demand-prediction?${params}`, { credentials: "include" })
      const json = await res.json()
      setRawDemand(JSON.stringify(json, null, 2))
      if (!json.success) {
        toast({ title: "Demande prédiction", description: String(json.error), variant: "destructive" })
        return
      }
      const d = json.data?.demand as DemandBlock | undefined
      const p = (json.data?.pricing as PricingRow[] | undefined) ?? []
      setDemand(d ?? null)
      setPricing(Array.isArray(p) ? p : [])
      const disc = json.data?.predictionMeta?.disclaimer
      setDemandDisclaimer(typeof disc === "string" ? disc : null)
    } catch {
      toast({ title: "Demande prédiction", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const fetchInsights = async () => {
    if (!vendorId) {
      toast({ title: "Choisir un vendeur", variant: "destructive" })
      return
    }
    setLoading("insights")
    setInsights(null)
    setRawInsights(null)
    try {
      const res = await fetch(`/api/analytics/customer-insights?vendorId=${encodeURIComponent(vendorId)}`, {
        credentials: "include",
      })
      const json = await res.json()
      setRawInsights(JSON.stringify(json, null, 2))
      if (!json.success) {
        toast({ title: "Insights clients", description: String(json.error), variant: "destructive" })
        return
      }
      setInsights((json.data?.insights as InsightsBlock) ?? null)
    } catch {
      toast({ title: "Insights clients", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const fetchForecast = async () => {
    if (!vendorId) {
      toast({ title: "Choisir un vendeur", variant: "destructive" })
      return
    }
    setLoading("forecast")
    setForecast(null)
    setRawForecast(null)
    try {
      const params = new URLSearchParams({ vendorId, period: forecastPeriod })
      const res = await fetch(`/api/analytics/sales-forecast?${params}`, { credentials: "include" })
      const json = await res.json()
      setRawForecast(JSON.stringify(json, null, 2))
      if (!json.success) {
        toast({ title: "Prévision ventes", description: String(json.error), variant: "destructive" })
        return
      }
      setForecast((json.data?.forecast as ForecastBlock) ?? null)
    } catch {
      toast({ title: "Prévision ventes", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const pricingChartData = pricing.map((row) => ({
    h: `${row.hour}h`,
    mult: row.multiplier,
  }))

  const topCustomerChart =
    insights?.topCustomers?.map((c) => ({
      name: c.customerName?.slice(0, 12) || c.customerId.slice(0, 8),
      commandes: c.orderCount,
      dépensé: Math.round(Number(c.totalSpent) || 0),
    })) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LineChartIcon className="h-4 w-4" />
          Analytique avancée
        </CardTitle>
        <CardDescription>
          Prévision de demande par zone, insights clients et prévisions de ventes — visualisations + JSON détaillé en
          option.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Prévision de demande</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label>Zone</Label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Zone…" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}
                      {z.city ? ` · ${z.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <input
                type="date"
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={predDate}
                onChange={(e) => setPredDate(e.target.value)}
              />
            </div>
            <Button type="button" disabled={loading === "demand"} onClick={() => void fetchDemand()}>
              {loading === "demand" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Charger"}
            </Button>
          </div>

          {demand ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Demande prédite (unité modèle)</p>
                  <p className="text-xl font-semibold tabular-nums">{demand.predictedDemand ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Heures de pointe</p>
                  <p className="font-medium">{(demand.peakHours ?? []).join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Impacts (placeholders)</p>
                  <p className="text-xs">
                    Météo ×{demand.weatherImpact ?? "—"} · Événements ×{demand.eventImpact ?? "—"}
                  </p>
                </div>
              </div>
              {demandDisclaimer ? <p className="text-xs text-muted-foreground italic">{demandDisclaimer}</p> : null}
              {pricingChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <p className="text-xs font-medium mb-2">Multiplicateurs tarifaires par heure</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pricingChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="h" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} width={36} domain={[0, "auto"]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="mult" name="Multiplicateur" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowDemandJson((v) => !v)}>
                {showDemandJson ? "Masquer" : "Voir"} JSON brut
              </Button>
              {showDemandJson && rawDemand ? (
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{rawDemand}</pre>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Vendeur pour insights / prévisions</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label>Vendeur</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Vendeur…" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} · {v.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Période prévision</Label>
              <Select value={forecastPeriod} onValueChange={(v: "week" | "month") => setForecastPeriod(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="secondary" disabled={loading === "insights"} onClick={() => void fetchInsights()}>
              {loading === "insights" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Insights clients"}
            </Button>
            <Button type="button" variant="secondary" disabled={loading === "forecast"} onClick={() => void fetchForecast()}>
              {loading === "forecast" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Prévision ventes"}
            </Button>
          </div>

          {insights ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Clients uniques</p>
                  <p className="text-xl font-semibold tabular-nums">{insights.totalCustomers ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clients récurrents</p>
                  <p className="text-xl font-semibold tabular-nums">{insights.repeatCustomers ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taux réachat</p>
                  <p className="text-xl font-semibold tabular-nums">{insights.repeatRate ?? "—"}%</p>
                </div>
              </div>
              {topCustomerChart.length > 0 ? (
                <div className="h-72 w-full">
                  <p className="text-xs font-medium mb-2">Top clients (commandes & dépenses DZD)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomerChart} margin={{ top: 8, right: 8, left: 8, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={56} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="commandes" name="Commandes" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="dépensé" name="DZD dépensé" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Pas encore assez de données pour le graphique.</p>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowInsightsJson((v) => !v)}>
                {showInsightsJson ? "Masquer" : "Voir"} JSON brut
              </Button>
              {showInsightsJson && rawInsights ? (
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{rawInsights}</pre>
              ) : null}
            </div>
          ) : null}

          {forecast ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Période</p>
                  <p className="font-medium uppercase">{forecast.period ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CA prévu (DZD, heuristique)</p>
                  <p className="text-xl font-semibold tabular-nums">{forecast.predictedSales ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CA / jour moy.</p>
                  <p className="text-lg font-semibold tabular-nums">{forecast.avgDailyRevenue ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commandes historiques</p>
                  <p className="text-lg font-semibold tabular-nums">{forecast.historicalOrders ?? "—"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tendance : <strong>{forecast.trend ?? "—"}</strong>
                {forecast.confidence != null ? ` · Confiance affichée : ${forecast.confidence}` : null}
              </p>
              <div className="h-48 w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { label: "Moy. jour", val: forecast.avgDailyRevenue ?? 0 },
                      {
                        label: "Prévision période",
                        val:
                          forecast.period === "week"
                            ? Math.round((forecast.avgDailyRevenue ?? 0) * 7)
                            : Math.round((forecast.avgDailyRevenue ?? 0) * 30),
                      },
                      { label: "Prédiction API", val: forecast.predictedSales ?? 0 },
                    ]}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 72, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={88} />
                    <Tooltip />
                    <Bar dataKey="val" name="DZD" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForecastJson((v) => !v)}>
                {showForecastJson ? "Masquer" : "Voir"} JSON brut
              </Button>
              {showForecastJson && rawForecast ? (
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{rawForecast}</pre>
              ) : null}
            </div>
          ) : null}
        </section>
      </CardContent>
    </Card>
  )
}
