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
        title: "Erreur",
        description: "Impossible de charger Opérations vendeurs / livreurs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

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
        toast({ title: "Magasin mis à jour" })
        setEditStore(null)
        load()
      } else {
        toast({
          title: "Erreur",
          description: apiErrorMessage(data.error, "Mise à jour impossible"),
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Erreur", description: "Mise à jour impossible", variant: "destructive" })
    } finally {
      setSaveStoreLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assignOrderId || !assignDriverId) {
      toast({ title: "Sélection requise", description: "Commande et livreur", variant: "destructive" })
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
          title: "Livreur assigné",
          description: `Commande #${assignOrderId.slice(0, 8)}…`,
        })
        await onRefreshOrders?.()
      } else {
        toast({
          title: "Erreur",
          description: apiErrorMessage(data.error, "Assignation impossible"),
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Erreur", description: "Assignation impossible", variant: "destructive" })
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
            Statistiques vendeurs
          </CardTitle>
          <CardDescription>Commandes, magasins, chiffre d&apos;affaires (livré)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun vendeur</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">Vendeur</th>
                    <th className="text-right p-2">Magasins</th>
                    <th className="text-right p-2">Cmd (total)</th>
                    <th className="text-right p-2">Cmd livrées</th>
                    <th className="text-right p-2">CA livré (DZD)</th>
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
            Magasins
          </CardTitle>
          <CardDescription>Activer ou modifier les informations (tous vendeurs)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun magasin</p>
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
                      {s.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    <Badge variant="outline">{s._count?.orders ?? 0} commandes</Badge>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditStore(s)}>
                  Gérer
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
            Positions livreurs
          </CardTitle>
          <CardDescription>Hors ligne / en ligne selon dernier signalement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune position enregistrée</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg text-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-2">Livreur</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2">Lat / Long</th>
                    <th className="p-2">Maj</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.slice(0, 40).map((loc: any) => {
                    const drv = loc.driver as { id: string; name: string }
                    const at = loc.updatedAt ? new Date(loc.updatedAt as string).toLocaleString("fr-FR") : "—"
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
            Performance (persistée + livraisons livrées)
          </CardTitle>
          <CardDescription>
            Indicateurs agrégés et nombre de livraisons terminées (DB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">Livreur</th>
                  <th className="text-right p-2">Total livré (DB stats)</th>
                  <th className="text-right p-2">Temps moy.</th>
                  <th className="text-right p-2">À l&apos;heure %</th>
                  <th className="text-right p-2">Note</th>
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
          <CardTitle>Assignation manuelle</CardTitle>
          <CardDescription>
            États admis : READY ou ASSIGNED (aligné avec l&apos;assignation automatique).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2 min-w-[200px]">
            <Label>Commande</Label>
            <Select value={assignOrderId} onValueChange={setAssignOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
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
            <Label>Livreur</Label>
            <Select value={assignDriverId} onValueChange={setAssignDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
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
            {assignLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assigner"}
          </Button>
          {assignableOrders.length === 0 && (
            <p className="text-xs text-muted-foreground w-full">Aucune commande READY/ASSIGNED dans le lot chargé.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editStore} onOpenChange={(o) => !o && setEditStore(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Magasin · {editableStoreForm.name}</DialogTitle>
            <DialogDescription>Mettre à jour les champs puis enregistrer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom</Label>
              <Input
                value={editableStoreForm.name ?? ""}
                onChange={(e) => editStore && setEditStore({ ...editStore, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Input
                value={editableStoreForm.type ?? ""}
                onChange={(e) => editStore && setEditStore({ ...editStore, type: e.target.value })}
              />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={editableStoreForm.address ?? ""}
                onChange={(e) => editStore && setEditStore({ ...editStore, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input
                value={editableStoreForm.city ?? ""}
                onChange={(e) => editStore && setEditStore({ ...editStore, city: e.target.value })}
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={editableStoreForm.phone ?? ""}
                onChange={(e) =>
                  editStore &&
                  setEditStore({ ...editStore, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Délai de livraison (texte)</Label>
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
              <Label htmlFor="store-active">Magasin actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStore(null)}>
              Annuler
            </Button>
            <Button onClick={() => void handleSaveStore()} disabled={saveStoreLoading}>
              {saveStoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
