"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Checkbox } from "@/root/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/root/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/root/components/ui/collapsible"
import { cn } from "@/root/lib/utils"
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  RotateCcw,
  Settings2,
  UtensilsCrossed,
  Volume2,
  X,
} from "lucide-react"
import type { Order } from "@/root/lib/types"
import type { KdsColumnKey } from "@/lib/kitchen-kds-preferences"
import {
  loadColumnSounds,
  loadKdsStations,
  loadLineStations,
  loadWarnMinutes,
  saveColumnSounds,
  saveKdsStations,
  saveLineStations,
  saveWarnMinutes,
  setLineStation,
  type ColumnSoundPrefs,
  type LineStationMap,
} from "@/lib/kitchen-kds-preferences"
import { playKitchenColumnChime } from "@/lib/kitchen-kds-sounds"

const KITCHEN_STATUSES = new Set(["PENDING", "ACCEPTED", "PREPARING", "READY"])
const SESSION_DISMISSED_KEY = "vendor-kds-dismissed-ready-v1"
const SESSION_RECALL_KEY = "vendor-kds-recall-stack-v1"

interface KitchenTabProps {
  orders: Order[]
  loadingState: { orders: boolean }
  translate: (fr: string, ar: string) => string
  handleUpdateOrderStatus: (order: Order, status: string) => Promise<void>
}

function orderTableHint(order: Order): string | null {
  const o = order as {
    tableId?: string
    tableCode?: string
    tableLabel?: string
    metadata?: { table?: string; tableId?: string }
  }
  return (
    o.tableLabel ||
    o.tableCode ||
    o.tableId ||
    o.metadata?.table ||
    o.metadata?.tableId ||
    null
  )
}

function loadDismissedReady(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = sessionStorage.getItem(SESSION_DISMISSED_KEY)
    if (!raw) return new Set()
    const a = JSON.parse(raw) as unknown
    if (!Array.isArray(a)) return new Set()
    return new Set(a.filter((x): x is string => typeof x === "string"))
  } catch {
    return new Set()
  }
}

function saveDismissedReady(set: Set<string>): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_DISMISSED_KEY, JSON.stringify([...set]))
}

function loadRecallStack(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(SESSION_RECALL_KEY)
    if (!raw) return []
    const a = JSON.parse(raw) as unknown
    if (!Array.isArray(a)) return []
    return a.filter((x): x is string => typeof x === "string")
  } catch {
    return []
  }
}

function saveRecallStack(ids: string[]): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_RECALL_KEY, JSON.stringify(ids))
}

function getTimerStartMs(order: Order, status: string): number {
  const o = order as Order & {
    readyAt?: Date | string
    preparingAt?: Date | string
    acceptedAt?: Date | string
  }
  const t = (v: Date | string | undefined) => (v ? new Date(v).getTime() : NaN)
  if (status === "READY") {
    const r = t(o.readyAt)
    if (!Number.isNaN(r)) return r
  }
  if (status === "PREPARING") {
    const p = t(o.preparingAt)
    if (!Number.isNaN(p)) return p
  }
  if (status === "ACCEPTED") {
    const a = t(o.acceptedAt)
    if (!Number.isNaN(a)) return a
  }
  return new Date(order.createdAt || Date.now()).getTime()
}

function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, "0")}`
}

function orderMatchesStationFilter(order: Order, stationFilter: string, lineMap: LineStationMap, hasStations: boolean): boolean {
  if (!hasStations || stationFilter === "__all__") return true
  const lines = lineMap[order.id]
  if (!lines || Object.keys(lines).length === 0) return true
  return Object.values(lines).includes(stationFilter)
}

export function KitchenTab({ orders, loadingState, translate, handleUpdateOrderStatus }: KitchenTabProps) {
  const [tick, setTick] = useState(() => Date.now())
  const [stations, setStations] = useState<string[]>([])
  const [stationFilter, setStationFilter] = useState<string>("__all__")
  const [lineStationMap, setLineStationMap] = useState<LineStationMap>({})
  const [columnSounds, setColumnSounds] = useState<ColumnSoundPrefs>(loadColumnSounds)
  const [warnMinutes, setWarnMinutes] = useState(15)
  const [newStationInput, setNewStationInput] = useState("")
  const [dismissedReady, setDismissedReady] = useState<Set<string>>(() => loadDismissedReady())
  const [recallStack, setRecallStack] = useState<string[]>(() => loadRecallStack())
  const [hydrated, setHydrated] = useState(false)

  const prevColumnIdsRef = useRef<Record<KdsColumnKey, Set<string>> | null>(null)
  const skipFirstSoundRef = useRef(true)

  useEffect(() => {
    setStations(loadKdsStations())
    setLineStationMap(loadLineStations())
    setColumnSounds(loadColumnSounds())
    setWarnMinutes(loadWarnMinutes())
    setDismissedReady(loadDismissedReady())
    setRecallStack(loadRecallStack())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (stations.length === 0 && stationFilter !== "__all__") setStationFilter("__all__")
  }, [stations.length, stationFilter])

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const kitchenOrders = useMemo(
    () => orders.filter((o) => KITCHEN_STATUSES.has(String(o.status))),
    [orders],
  )

  const byStatusRaw = useMemo(() => {
    const pending = kitchenOrders.filter((o) => String(o.status) === "PENDING")
    const accepted = kitchenOrders.filter((o) => String(o.status) === "ACCEPTED")
    const preparing = kitchenOrders.filter((o) => String(o.status) === "PREPARING")
    const ready = kitchenOrders.filter((o) => String(o.status) === "READY")
    return { pending, accepted, preparing, ready }
  }, [kitchenOrders])

  const hasStations = stations.length > 0

  const byStatus = useMemo(() => {
    const f = (list: Order[]) =>
      hasStations && stationFilter !== "__all__" ? list.filter((o) => orderMatchesStationFilter(o, stationFilter, lineStationMap, hasStations)) : list
    let readyList = byStatusRaw.ready.filter((o) => !dismissedReady.has(o.id))
    if (hasStations && stationFilter !== "__all__") {
      readyList = readyList.filter((o) => orderMatchesStationFilter(o, stationFilter, lineStationMap, hasStations))
    }
    return {
      pending: f(byStatusRaw.pending),
      accepted: f(byStatusRaw.accepted),
      preparing: f(byStatusRaw.preparing),
      ready: readyList,
    }
  }, [byStatusRaw, dismissedReady, hasStations, lineStationMap, stationFilter])

  useEffect(() => {
    const readyIds = new Set(byStatusRaw.ready.map((o) => o.id))
    setDismissedReady((prev) => {
      let changed = false
      const next = new Set(prev)
      for (const id of prev) {
        if (!readyIds.has(id)) {
          next.delete(id)
          changed = true
        }
      }
      if (changed) saveDismissedReady(next)
      return changed ? next : prev
    })
    setRecallStack((prev) => {
      const next = prev.filter((id) => readyIds.has(id))
      if (next.length !== prev.length) saveRecallStack(next)
      return next
    })
  }, [byStatusRaw.ready])

  useEffect(() => {
    if (!hydrated || loadingState.orders) return
    const nextSets: Record<KdsColumnKey, Set<string>> = {
      pending: new Set(byStatus.pending.map((o) => o.id)),
      accepted: new Set(byStatus.accepted.map((o) => o.id)),
      preparing: new Set(byStatus.preparing.map((o) => o.id)),
      ready: new Set(byStatus.ready.map((o) => o.id)),
    }
    if (skipFirstSoundRef.current) {
      skipFirstSoundRef.current = false
      prevColumnIdsRef.current = nextSets
      return
    }
    const prev = prevColumnIdsRef.current
    if (!prev) {
      prevColumnIdsRef.current = nextSets
      return
    }
    const cols: KdsColumnKey[] = ["pending", "accepted", "preparing", "ready"]
    for (const col of cols) {
      if (!columnSounds[col]) continue
      for (const id of nextSets[col]) {
        if (!prev[col].has(id)) playKitchenColumnChime(col)
      }
    }
    prevColumnIdsRef.current = nextSets
  }, [byStatus, columnSounds, hydrated, loadingState.orders])

  const bumpReady = useCallback((orderId: string) => {
    setDismissedReady((prev) => {
      const next = new Set(prev)
      next.add(orderId)
      saveDismissedReady(next)
      return next
    })
    setRecallStack((prev) => {
      const next = [orderId, ...prev.filter((x) => x !== orderId)].slice(0, 12)
      saveRecallStack(next)
      return next
    })
  }, [])

  const recallLast = useCallback(() => {
    setRecallStack((prev) => {
      if (prev.length === 0) return prev
      const [head, ...rest] = prev
      setDismissedReady((d) => {
        const next = new Set(d)
        next.delete(head)
        saveDismissedReady(next)
        return next
      })
      saveRecallStack(rest)
      return rest
    })
  }, [])

  const addStation = () => {
    const name = newStationInput.trim()
    if (!name) return
    if (stations.includes(name)) {
      setNewStationInput("")
      return
    }
    const next = [...stations, name]
    setStations(next)
    saveKdsStations(next)
    setNewStationInput("")
  }

  const removeStation = (name: string) => {
    const next = stations.filter((s) => s !== name)
    setStations(next)
    saveKdsStations(next)
    if (stationFilter === name) setStationFilter("__all__")
    const map = loadLineStations()
    let changed = false
    for (const oid of Object.keys(map)) {
      const lines = { ...map[oid] }
      for (const k of Object.keys(lines)) {
        if (lines[k] === name) {
          delete lines[k]
          changed = true
        }
      }
      if (Object.keys(lines).length === 0) delete map[oid]
      else map[oid] = lines
    }
    if (changed) {
      saveLineStations(map)
      setLineStationMap(map)
    }
  }

  const onLineStationChange = (orderId: string, lineIndex: number, value: string) => {
    const station = value === "__none__" ? "" : value
    const map = setLineStation(orderId, lineIndex, station)
    setLineStationMap(map)
  }

  const toggleColumnSound = (key: KdsColumnKey, checked: boolean) => {
    setColumnSounds((prev) => {
      const next = { ...prev, [key]: checked }
      saveColumnSounds(next)
      return next
    })
  }

  const onWarnMinutesChange = (v: string) => {
    const n = Number.parseInt(v, 10)
    const m = Number.isFinite(n) ? Math.min(120, Math.max(1, n)) : 15
    setWarnMinutes(m)
    saveWarnMinutes(m)
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-200 text-yellow-950 dark:bg-yellow-900/40 dark:text-yellow-200",
    ACCEPTED: "bg-sky-200 text-sky-950 dark:bg-sky-900/40 dark:text-sky-200",
    PREPARING: "bg-orange-200 text-orange-950 dark:bg-orange-900/40 dark:text-orange-200",
    READY: "bg-emerald-200 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-200",
  }

  const renderTicket = (order: Order) => {
    const status = String(order.status || "PENDING")
    const table = orderTableHint(order)
    const startMs = getTimerStartMs(order, status)
    const elapsedSec = Math.floor((tick - startMs) / 1000)
    const warnSec = warnMinutes * 60
    const timerBad = elapsedSec >= warnSec

    const lines = lineStationMap[order.id] || {}

    return (
      <Card key={order.id} className="border-2 border-border shadow-md">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl font-black tracking-tight">
              #{order.id.slice(0, 8)}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "tabular-nums text-sm font-bold px-2 py-1 rounded-md border",
                  timerBad
                    ? "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300"
                    : "border-muted bg-muted/50 text-muted-foreground",
                )}
                title={translate("Temps dans cette étape", "الوقت في هذه المرحلة")}
              >
                <Clock className="inline h-3.5 w-3.5 mr-1 align-middle" />
                {formatElapsed(elapsedSec)}
              </span>
              <Badge className={`text-sm font-semibold ${statusColors[status] || ""}`}>
                {status === "PENDING" && translate("Nouveau", "جديد")}
                {status === "ACCEPTED" && translate("Acceptée", "مقبولة")}
                {status === "PREPARING" && translate("En prep.", "قيد التحضير")}
                {status === "READY" && translate("Prête", "جاهزة")}
              </Badge>
            </div>
          </div>
          {table && (
            <p className="text-lg font-bold text-albaz-green-700 dark:text-albaz-green-300 mt-1">
              {translate("Table", "طاولة")} {table}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <ul className="space-y-2 text-base font-medium leading-snug">
            {(order.items || []).map(
              (
                item: {
                  quantity: number
                  price: number
                  product?: { name?: string }
                  productName?: string
                },
                idx: number,
              ) => (
                <li
                  key={idx}
                  className="flex flex-col gap-2 border-b border-border/60 pb-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="tabular-nums font-bold">{item.quantity}×</span>{" "}
                    {item.product?.name || item.productName || "—"}
                  </span>
                  {hasStations && (
                    <Select
                      value={lines[String(idx)] || "__none__"}
                      onValueChange={(v) => onLineStationChange(order.id, idx, v)}
                    >
                      <SelectTrigger className="h-9 w-full sm:w-[200px] text-sm" size="sm">
                        <SelectValue placeholder={translate("Poste", "محطة")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{translate("— Poste —", "— محطة —")}</SelectItem>
                        {stations.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </li>
              ),
            )}
          </ul>
          <div className="flex flex-col gap-2 pt-1">
            {status === "PENDING" && (
              <Button
                size="lg"
                className="h-14 text-lg bg-albaz-green-gradient hover:opacity-90 text-white"
                onClick={() => handleUpdateOrderStatus(order, "ACCEPTED")}
              >
                <CheckCircle className="w-6 h-6 mr-2 shrink-0" />
                {translate("Confirmer", "تأكيد")}
              </Button>
            )}
            {status === "ACCEPTED" && (
              <Button
                size="lg"
                className="h-14 text-lg bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => handleUpdateOrderStatus(order, "PREPARING")}
              >
                <Clock className="w-6 h-6 mr-2 shrink-0" />
                {translate("Commencer", "بدء التحضير")}
              </Button>
            )}
            {status === "PREPARING" && (
              <Button
                size="lg"
                className="h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleUpdateOrderStatus(order, "READY")}
              >
                <CheckCircle2 className="w-6 h-6 mr-2 shrink-0" />
                {translate("Prête", "جاهزة")}
              </Button>
            )}
            {status === "READY" && (
              <Button
                size="lg"
                variant="secondary"
                className="h-14 text-lg border-2"
                onClick={() => bumpReady(order.id)}
              >
                <UtensilsCrossed className="w-6 h-6 mr-2 shrink-0" />
                {translate("Bump (retirer l’écran)", "إزالة من الشاشة")}
              </Button>
            )}
            {(status === "PENDING" || status === "ACCEPTED" || status === "PREPARING") && (
              <Button
                variant="outline"
                size="lg"
                className="h-12 text-base border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => handleUpdateOrderStatus(order, "CANCELLED")}
              >
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                {translate("Annuler", "إلغاء")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const column = (
    colKey: KdsColumnKey,
    title: string,
    subtitle: string,
    list: Order[],
    icon: ReactNode,
    headerExtra?: ReactNode,
  ) => (
    <div className="flex min-h-[200px] flex-col gap-3 rounded-xl border bg-muted/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {headerExtra}
      </div>
      <div className="flex flex-col gap-3">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{translate("Aucun ticket", "لا يوجد طلب")}</p>
        ) : (
          list.map((o) => renderTicket(o))
        )}
      </div>
    </div>
  )

  const columnLabel = (key: KdsColumnKey) => {
    const labels: Record<KdsColumnKey, { fr: string; ar: string }> = {
      pending: { fr: "Nouveau", ar: "جديد" },
      accepted: { fr: "Acceptées", ar: "مقبولة" },
      preparing: { fr: "Préparation", ar: "تحضير" },
      ready: { fr: "Prêtes", ar: "جاهزة" },
    }
    return translate(labels[key].fr, labels[key].ar)
  }

  return (
    <div className="space-y-4 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            {translate("Écran cuisine", "شاشة المطبخ")}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-xl">
            {translate(
              "Postes de prep, bump / recall sur les tickets prêts, minuteur par ticket, son optionnel quand un ticket entre dans une colonne.",
              "محطات التحضير، إزالة واسترجاع للطلبات الجاهزة، مؤقت لكل تذكرة، صوت اختياري عند دخول تذكرة عمود.",
            )}
          </p>
        </div>
      </div>

      <Collapsible className="group rounded-xl border bg-card/50">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex w-full items-center justify-between gap-2 px-4 py-3 h-auto">
            <span className="flex items-center gap-2 font-semibold">
              <Settings2 className="h-5 w-5" />
              {translate("Réglages cuisine (KDS)", "إعدادات المطبخ")}
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 px-4 pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{translate("Postes (ex. Grill, Salades)", "محطات (مثلا مشوي، سلطات)")}</Label>
              <div className="flex gap-2">
                <Input
                  value={newStationInput}
                  onChange={(e) => setNewStationInput(e.target.value)}
                  placeholder={translate("Nom du poste", "اسم المحطة")}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStation())}
                />
                <Button type="button" onClick={addStation}>
                  {translate("Ajouter", "إضافة")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {stations.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1 py-1.5 text-sm">
                    {s}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={translate("Retirer", "حذف")}
                      onClick={() => removeStation(s)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{translate("Alerte minuteur (minutes)", "تنبيه المؤقت (دقائق)")}</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={warnMinutes}
                onChange={(e) => onWarnMinutesChange(e.target.value)}
                className="max-w-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                {translate("Le compteur passe en rouge après ce délai dans l’étape actuelle.", "يتحول العداد للأحمر بعد هذا الوقت في المرحلة الحالية.")}
              </p>
            </div>
          </div>
          {hasStations && (
            <div className="space-y-2">
              <Label>{translate("Filtrer par poste", "تصفية حسب المحطة")}</Label>
              <Select value={stationFilter} onValueChange={setStationFilter}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{translate("Tous les postes", "كل المحطات")}</SelectItem>
                  {stations.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {translate("Son à l’entrée d’un ticket dans la colonne", "صوت عند دخول تذكرة للعمود")}
            </Label>
            <div className="flex flex-wrap gap-4">
              {(["pending", "accepted", "preparing", "ready"] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={columnSounds[key]} onCheckedChange={(c) => toggleColumnSound(key, c === true)} />
                  {columnLabel(key)}
                </label>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {loadingState.orders ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {column(
            "pending",
            translate("Nouveau", "جديد"),
            translate("À confirmer", "بانتظار التأكيد"),
            byStatus.pending,
            <Clock className="h-6 w-6 text-yellow-600" />,
          )}
          {column(
            "accepted",
            translate("Acceptées", "مقبولة"),
            translate("File d’attente cuisine", "قائمة انتظار المطبخ"),
            byStatus.accepted,
            <CheckCircle className="h-6 w-6 text-sky-600" />,
          )}
          {column(
            "preparing",
            translate("En préparation", "قيد التحضير"),
            translate("Sur le feu", "على النار"),
            byStatus.preparing,
            <Flame className="h-6 w-6 text-orange-600" />,
          )}
          {column(
            "ready",
            translate("Prêtes", "جاهزة"),
            translate("À servir — Bump pour retirer", "للتقديم — Bump للإخفاء"),
            byStatus.ready,
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
            recallStack.length > 0 ? (
              <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1" onClick={recallLast}>
                <RotateCcw className="h-4 w-4" />
                {translate("Recall", "استرجاع")}
              </Button>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}
