"use client"

import { useEffect, useState, useMemo } from "react"
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
import { apiErrorMessage } from "../lib/api-error-message"
import { useAdminI18n } from "../lib/AdminI18nProvider"
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
  const { t } = useAdminI18n()
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
        toast({ title: t("adv.selectorsLoadFail"), variant: "destructive" })
      }
    })()
  }, [toast, t])

  const fetchDemand = async () => {
    if (!zoneId) {
      toast({ title: t("adv.chooseZone"), variant: "destructive" })
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
        toast({
          title: t("adv.toastDemandPred"),
          description: apiErrorMessage(json.error, t("opsCard.invalidResponse")),
          variant: "destructive",
        })
        return
      }
      const d = json.data?.demand as DemandBlock | undefined
      const p = (json.data?.pricing as PricingRow[] | undefined) ?? []
      setDemand(d ?? null)
      setPricing(Array.isArray(p) ? p : [])
      const disc = json.data?.predictionMeta?.disclaimer
      setDemandDisclaimer(typeof disc === "string" ? disc : null)
    } catch {
      toast({ title: t("adv.toastDemandPred"), variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const fetchInsights = async () => {
    if (!vendorId) {
      toast({ title: t("adv.chooseVendor"), variant: "destructive" })
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
        toast({
          title: t("adv.toastInsights"),
          description: apiErrorMessage(json.error, t("opsCard.invalidResponse")),
          variant: "destructive",
        })
        return
      }
      setInsights((json.data?.insights as InsightsBlock) ?? null)
    } catch {
      toast({ title: t("adv.toastInsights"), variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  const fetchForecast = async () => {
    if (!vendorId) {
      toast({ title: t("adv.chooseVendor"), variant: "destructive" })
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
        toast({
          title: t("adv.toastForecast"),
          description: apiErrorMessage(json.error, t("opsCard.invalidResponse")),
          variant: "destructive",
        })
        return
      }
      setForecast((json.data?.forecast as ForecastBlock) ?? null)
    } catch {
      toast({ title: t("adv.toastForecast"), variant: "destructive" })
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
      orderCount: c.orderCount,
      spentDzd: Math.round(Number(c.totalSpent) || 0),
    })) ?? []

  const forecastBarData = useMemo(() => {
    if (!forecast) return []
    const avg = forecast.avgDailyRevenue ?? 0
    return [
      { label: t("adv.chartAvgDay"), val: avg },
      {
        label: t("adv.chartForecastPeriod"),
        val: forecast.period === "week" ? Math.round(avg * 7) : Math.round(avg * 30),
      },
      { label: t("adv.chartApiPred"), val: forecast.predictedSales ?? 0 },
    ]
  }, [forecast, t])

  const jsonToggle = (show: boolean) => (show ? t("adv.hideJson") : t("adv.showJson"))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LineChartIcon className="h-4 w-4" />
          {t("adv.title")}
        </CardTitle>
        <CardDescription>{t("adv.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("adv.demandForecast")}</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label>{t("adv.zone")}</Label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={t("adv.zonePlaceholder")} />
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
              <Label>{t("adv.date")}</Label>
              <input
                type="date"
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={predDate}
                onChange={(e) => setPredDate(e.target.value)}
              />
            </div>
            <Button type="button" disabled={loading === "demand"} onClick={() => void fetchDemand()}>
              {loading === "demand" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("adv.load")}
            </Button>
          </div>

          {demand ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.predictedDemand")}</p>
                  <p className="text-xl font-semibold tabular-nums">{demand.predictedDemand ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.peakHours")}</p>
                  <p className="font-medium">{(demand.peakHours ?? []).join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.impacts")}</p>
                  <p className="text-xs">
                    {t("adv.weatherEvents", undefined, undefined, {
                      w: String(demand.weatherImpact ?? "—"),
                      e: String(demand.eventImpact ?? "—"),
                    })}
                  </p>
                </div>
              </div>
              {demandDisclaimer ? <p className="text-xs text-muted-foreground italic">{demandDisclaimer}</p> : null}
              {pricingChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <p className="text-xs font-medium mb-2">{t("adv.pricingMultipliers")}</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pricingChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="h" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} width={36} domain={[0, "auto"]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="mult" name={t("adv.multiplier")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowDemandJson((v) => !v)}>
                {jsonToggle(showDemandJson)} {t("adv.rawJson")}
              </Button>
              {showDemandJson && rawDemand ? (
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{rawDemand}</pre>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("adv.vendorInsightsSection")}</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label>{t("common.vendor")}</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder={t("adv.vendorPlaceholder")} />
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
              <Label>{t("adv.forecastPeriod")}</Label>
              <Select value={forecastPeriod} onValueChange={(v: "week" | "month") => setForecastPeriod(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t("adv.week")}</SelectItem>
                  <SelectItem value="month">{t("adv.month")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="secondary" disabled={loading === "insights"} onClick={() => void fetchInsights()}>
              {loading === "insights" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("adv.customerInsightsBtn")}
            </Button>
            <Button type="button" variant="secondary" disabled={loading === "forecast"} onClick={() => void fetchForecast()}>
              {loading === "forecast" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("adv.salesForecastBtn")}
            </Button>
          </div>

          {insights ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.uniqueCustomers")}</p>
                  <p className="text-xl font-semibold tabular-nums">{insights.totalCustomers ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.repeatCustomers")}</p>
                  <p className="text-xl font-semibold tabular-nums">{insights.repeatCustomers ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.repeatRate")}</p>
                  <p className="text-xl font-semibold tabular-nums">{insights.repeatRate ?? "—"}%</p>
                </div>
              </div>
              {topCustomerChart.length > 0 ? (
                <div className="h-72 w-full">
                  <p className="text-xs font-medium mb-2">{t("adv.topCustomersChart")}</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomerChart} margin={{ top: 8, right: 8, left: 8, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={56} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="orderCount" name={t("adv.barOrders")} fill="#82ca9d" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spentDzd" name={t("adv.barSpentDzd")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("adv.notEnoughData")}</p>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowInsightsJson((v) => !v)}>
                {jsonToggle(showInsightsJson)} {t("adv.rawJson")}
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
                  <p className="text-xs text-muted-foreground">{t("adv.forecastPeriodLabel")}</p>
                  <p className="font-medium uppercase">{forecast.period ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.forecastSalesHint")}</p>
                  <p className="text-xl font-semibold tabular-nums">{forecast.predictedSales ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.avgDaily")}</p>
                  <p className="text-lg font-semibold tabular-nums">{forecast.avgDailyRevenue ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("adv.historicalOrders")}</p>
                  <p className="text-lg font-semibold tabular-nums">{forecast.historicalOrders ?? "—"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("adv.trend")} <strong>{forecast.trend ?? "—"}</strong>
                {forecast.confidence != null ? ` · ${t("adv.confidenceShown")} ${forecast.confidence}` : null}
              </p>
              <div className="h-48 w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={forecastBarData}
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
                {jsonToggle(showForecastJson)} {t("adv.rawJson")}
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
