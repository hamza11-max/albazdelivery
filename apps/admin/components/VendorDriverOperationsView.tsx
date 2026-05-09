"use client"

import { useCallback, useEffect, useState } from "react"
import type { User as UserType } from "@/root/lib/types"
import { OrderStatus } from "@/root/lib/constants"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@albaz/ui"
import { Loader2, MapPin, PieChart, Store, Truck } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"
import { apiErrorMessage } from "../lib/api-error-message"
import { useAdminI18n } from "../lib/AdminI18nProvider"

interface OrderLike {
  id: string
  status?: string
  total?: number
  city?: string
  driverId?: string | null
}

interface VendorDriverOperationsViewProps {
  drivers: UserType[]
  orders: OrderLike[]
  onRefreshOrders?: () => void | Promise<void>
}

type VendorRow = {
  vendor: UserType & { createdAt?: string | Date }
  ordersCount: number
  revenueDelivered: number
  deliveredOrders: number
  storesCount: number
}

type StoreRecord = {
  id: string
  name: string
  type: string
  address: string
  city: string
  phone: string | null
  rating: number
  deliveryTime: string
  isActive: boolean
  vendor?: { id: string; name: string; email: string }
  category?: { nameFr?: string; slug?: string }
  _count?: { orders: number; products: number }
}

export function VendorDriverOperationsView({
  drivers,
  orders,
  onRefreshOrders,
}: VendorDriverOperationsViewProps) {
  const { toast } = useToast()
  const { t, language } = useAdminI18n()

  const [stats, setStats] = useState<VendorRow[]>([])
  const [stores, setStores] = useState<StoreRecord[]>([])
  const [locations, setLocations] = useState<Array<Record<string, unknown>>>([])
  const [performances, setPerformances] = useState<Array<Record<string, unknown>>>([])
  const [deliveredCountByDriver, setDeliveredCountByDriver] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editStore, setEditStore] = useState<StoreRecord | null>(null)
  const [saveStoreLoading, setSaveStoreLoading] = useState(false)
  const [assignOrderId, setAssignOrderId] = useState<string>("")
  const [assignDriverId, setAssignDriverId] = useState<string>("")
  const [assignLoading, setAssignLoading] = useState(false)

  const editableStoreForm = editStore ?? ({} as StoreRecord)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, stRes, oRes] = await Promise.all([
        fetch("/api/admin/vendors/statistics", { credentials: "include" }),
        fetch("/api/admin/stores", { credentials: "include" }),
        fetch("/api/admin/drivers/overview", { credentials: "include" }),
      ])

      const sJson = await sRes.json()
      const stJson = await stRes.json()
      const oJson = await oRes.json()

      if (sJson?.success && sJson.data?.statistics) {
        setStats(sJson.data.statistics)
      }
      if (stJson?.success && Array.isArray(stJson.data?.stores)) {
        setStores(stJson.data.stores as StoreRecord[])
      }
      if (oJson?.success) {
        setLocations(oJson.data?.locations ?? [])
        setPerformances(oJson.data?.performances ?? [])
        setDeliveredCountByDriver(oJson.data?.deliveredCountByDriver ?? {})
      }
    } catch (e) {
      console.error("[VendorDriverOperationsView]", e)
      toast({
        title: t("common.error"),
        description: t("ops.loadError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    load()
  }, [load])

  const assignableOrders = orders.filter((o) => {
    const s = String(o.status ?? "").toUpperCase()
    return s === OrderStatus.READY || s === OrderStatus.ASSIGNED
  })

  const handleSaveStore = async () => {
    if (!editStore) return
    setSaveStoreLoading(true)
    try {
      const res = await fetchWithCsrf(`/api/admin/stores/${editStore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editableStoreForm.name,
          type: editableStoreForm.type,
          address: editableStoreForm.address,
          city: editableStoreForm.city,
          phone: editableStoreForm.phone,
          deliveryTime: editableStoreForm.deliveryTime,
          isActive: editableStoreForm.isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: t("ops.storeUpdated") })
        setEditStore(null)
        load()
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("products.patchFail")),
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: t("common.error"), description: t("products.patchFail"), variant: "destructive" })
    } finally {
      setSaveStoreLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assignOrderId || !assignDriverId) {
      toast({ title: t("ops.selectRequired"), description: t("ops.selectRequiredDesc"), variant: "destructive" })
      return
    }
    setAssignLoading(true)
    try {
      const res = await fetchWithCsrf(`/api/admin/orders/${assignOrderId}/assign-driver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: assignDriverId }),
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: t("ops.driverAssigned"),
          description: t("ops.orderPrefix", undefined, undefined, { id: assignOrderId.slice(0, 8) }),
        })
        await onRefreshOrders?.()
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("admin.err.assign", "Assignation impossible", "تعذر التعيين")),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("admin.err.assign", "Assignation impossible", "تعذر التعيين"),
        variant: "destructive",
      })
    } finally {
      setAssignLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            {t("ops.vendorStatsTitle")}
          </CardTitle>
          <CardDescription>{t("ops.vendorStatsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ops.noVendors")}</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">{t("common.vendor")}</th>
                    <th className="text-right p-2">{t("ops.thStores")}</th>
                    <th className="text-right p-2">{t("ops.thOrdersTotal")}</th>
                    <th className="text-right p-2">{t("ops.thOrdersDelivered")}</th>
                    <th className="text-right p-2">{t("ops.thRevenueDelivered")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((row) => (
                    <tr key={row.vendor.id} className="border-b border-border last:border-0">
                      <td className="p-2">{row.vendor.name}</td>
                      <td className="text-right p-2">{row.storesCount}</td>
                      <td className="text-right p-2">{row.ordersCount}</td>
                      <td className="text-right p-2">{row.deliveredOrders}</td>
                      <td className="text-right p-2 font-medium tabular-nums">
                        {Math.round(row.revenueDelivered)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            {t("ops.storesTitle")}
          </CardTitle>
          <CardDescription>{t("ops.storesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ops.noStores")}</p>
          ) : (
            stores.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <p className="text-xs text-muted-foreground">
                    {s.vendor?.name} · {s.city} · {(s.category as { nameFr?: string })?.nameFr ?? ""}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant={s.isActive ? "default" : "secondary"}>
                      {s.isActive ? t("products.active") : t("products.inactive")}
                    </Badge>
                    <Badge variant="outline">
                      {t("ops.orderCount", undefined, undefined, { count: String(s._count?.orders ?? 0) })}
                    </Badge>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditStore(s)}>
                  {t("ops.manage")}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t("ops.driverLocationsTitle")}
          </CardTitle>
          <CardDescription>{t("ops.driverLocationsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ops.noLocations")}</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg text-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-2">{t("common.driver")}</th>
                    <th className="p-2">{t("common.status")}</th>
                    <th className="p-2">{t("ops.thLatLong")}</th>
                    <th className="p-2">{t("ops.thUpdated")}</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.slice(0, 40).map((loc: any) => {
                    const drv = loc.driver as { id: string; name: string }
                    const at = loc.updatedAt
                      ? new Date(loc.updatedAt as string).toLocaleString(language === "ar" ? "ar-DZ" : "fr-FR")
                      : "—"
                    return (
                      <tr key={loc.id as string} className="border-b border-border">
                        <td className="p-2">{drv?.name ?? "—"}</td>
                        <td className="p-2">
                          <Badge variant="outline">{String(loc.status)}</Badge>
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {(loc.latitude as number).toFixed(4)}, {(loc.longitude as number).toFixed(4)}
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{at}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {t("ops.performanceTitle")}
          </CardTitle>
          <CardDescription>{t("ops.performanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">{t("common.driver")}</th>
                  <th className="text-right p-2">{t("ops.thTotalDeliveredDb")}</th>
                  <th className="text-right p-2">{t("ops.thAvgTime")}</th>
                  <th className="text-right p-2">{t("ops.thOnTimePct")}</th>
                  <th className="text-right p-2">{t("ops.thRating")}</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const agg = performances.find((p: any) => p.driverId === d.id) as
                    | Record<string, unknown>
                    | undefined
                  const del = deliveredCountByDriver[d.id] ?? undefined
                  return (
                    <tr key={d.id} className="border-b border-border">
                      <td className="p-2">{d.name}</td>
                      <td className="text-right p-2 tabular-nums">
                        {agg?.totalDeliveries != null ? String(agg.totalDeliveries) : del ?? "—"}
                      </td>
                      <td className="text-right p-2 tabular-nums">
                        {agg?.averageDeliveryTime != null ? `${Number(agg.averageDeliveryTime).toFixed(1)} min` : "—"}
                      </td>
                      <td className="text-right p-2 tabular-nums">
                        {agg?.onTimePercentage != null ? `${Number(agg.onTimePercentage).toFixed(0)}%` : "—"}
                      </td>
                      <td className="text-right p-2 tabular-nums">
                        {agg?.rating != null ? Number(agg.rating).toFixed(2) : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("ops.assignTitle")}</CardTitle>
          <CardDescription>{t("ops.assignDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2 min-w-[200px]">
            <Label>{t("ops.order")}</Label>
            <Select value={assignOrderId} onValueChange={setAssignOrderId}>
              <SelectTrigger>
                <SelectValue placeholder={t("subscriptions.pickVendor")} />
              </SelectTrigger>
              <SelectContent>
                {assignableOrders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    #{o.id.slice(0, 8)} · {String(o.status)} · {(o.total ?? 0)} DZD
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[200px]">
            <Label>{t("common.driver")}</Label>
            <Select value={assignDriverId} onValueChange={setAssignDriverId}>
              <SelectTrigger>
                <SelectValue placeholder={t("subscriptions.pickVendor")} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            disabled={assignLoading || !assignOrderId || !assignDriverId}
            onClick={() => void handleAssign()}
          >
            {assignLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ops.assign")}
          </Button>
          {assignableOrders.length === 0 && (
            <p className="text-xs text-muted-foreground w-full">{t("ops.noReadyOrders")}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editStore} onOpenChange={(o) => !o && setEditStore(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("ops.storeEditTitle", undefined, undefined, { name: editableStoreForm.name || "" })}</DialogTitle>
            <DialogDescription>{t("ops.storeEditDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("common.name")}</Label>
              <Input
                value={editableStoreForm.name ?? ""}
                onChange={(e) => editStore && setEditStore({ ...editStore, name: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("ops.type")}</Label>
              <Input
                value={editableStoreForm.type ?? ""}
                onChange={(e) => editStore && setEditStore({ ...editStore, type: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("common.address")}</Label>
              <Input
                value={editableStoreForm.address ?? ""}
                onChange={(e) => editStore && setEditStore({ ...editStore, address: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("common.city")}</Label>
              <Input
                value={editableStoreForm.city ?? ""}
                onChange={(e) => editStore && setEditStore({ ...editStore, city: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("common.phone")}</Label>
              <Input
                value={editableStoreForm.phone ?? ""}
                onChange={(e) =>
                  editStore &&
                  setEditStore({ ...editStore, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t("ops.deliveryTime")}</Label>
              <Input
                value={editableStoreForm.deliveryTime ?? ""}
                onChange={(e) =>
                  editStore &&
                  setEditStore({ ...editStore, deliveryTime: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(editStore?.isActive)}
                id="store-active"
                onChange={(e) =>
                  editStore && setEditStore({ ...editStore, isActive: e.target.checked })
                }
              />
              <Label htmlFor="store-active">{t("ops.storeActive")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStore(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void handleSaveStore()} disabled={saveStoreLoading}>
              {saveStoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
