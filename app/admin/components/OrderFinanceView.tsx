"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { User as UserType } from "@/root/lib/types"
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
import { Loader2, Plus, RefreshCw, Wallet } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"
import { apiErrorMessage } from "../lib/api-error-message"

const STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "IN_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const

interface OrderRow {
  id: string
  status?: string
  total?: number
  city?: string
  paymentMethod?: string
  createdAt?: string | Date
}

interface OrderFinanceViewProps {
  customers: UserType[]
  orders: OrderRow[]
  onRefreshOrders: () => void | Promise<void>
}

type ProductOpt = { id: string; name: string; price: number }
type Line = { productId: string; quantity: number; price: number }

export function OrderFinanceView({ customers, orders, onRefreshOrders }: OrderFinanceViewProps) {
  const { toast } = useToast()
  const [summary, setSummary] = useState<{
    totalOrders: number
    deliveredOrders: number
    revenueDelivered: number
    pendingRefundsCount: number
    refundsAmountApprovedOrCompleted: number
  } | null>(null)
  const [stores, setStores] = useState<Array<{ id: string; name: string; city: string }>>([])
  const [refundsList, setRefundsList] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [patchStatus, setPatchStatus] = useState<string>("")
  const [patching, setPatching] = useState(false)

  const [refundOrderId, setRefundOrderId] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [refunding, setRefunding] = useState(false)

  const [manualCustomer, setManualCustomer] = useState("")
  const [manualStore, setManualStore] = useState("")
  const [manualLines, setManualLines] = useState<Line[]>([{ productId: "", quantity: 1, price: 0 }])
  const [products, setProducts] = useState<ProductOpt[]>([])
  const [manualAddress, setManualAddress] = useState("")
  const [manualCity, setManualCity] = useState("")
  const [manualPhone, setManualPhone] = useState("")
  const [manualFee, setManualFee] = useState(500)
  const [manualPay, setManualPay] = useState<"CASH" | "CARD" | "WALLET">("CASH")
  const [creating, setCreating] = useState(false)

  const [payoutsList, setPayoutsList] = useState<Array<Record<string, unknown>>>([])
  const [vendorsForPayout, setVendorsForPayout] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [payoutVendorId, setPayoutVendorId] = useState("")
  const [payoutPeriod, setPayoutPeriod] = useState("")
  const [payoutGross, setPayoutGross] = useState("")
  const [payoutFees, setPayoutFees] = useState("0")
  const [payoutNet, setPayoutNet] = useState("")
  const [payoutStatus, setPayoutStatus] = useState("RECORDED")
  const [payoutEta, setPayoutEta] = useState("Saisie manuelle")
  const [payoutBusy, setPayoutBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [fin, st, rf, po, vu] = await Promise.all([
        fetch("/api/admin/financial/summary", { credentials: "include" }),
        fetch("/api/admin/stores", { credentials: "include" }),
        fetch("/api/admin/refunds?limit=30", { credentials: "include" }),
        fetch("/api/admin/finance/payouts?limit=100", { credentials: "include" }),
        fetch("/api/admin/users?role=VENDOR&status=APPROVED&limit=200", { credentials: "include" }),
      ])
      const [fj, sj, rj, poj, vuj] = await Promise.all([fin.json(), st.json(), rf.json(), po.json(), vu.json()])
      if (fj.success && fj.data?.summary) setSummary(fj.data.summary)
      if (sj.success && sj.data?.stores)
        setStores(
          (sj.data.stores as { id: string; name: string; city: string }[]).map((s) => ({
            id: s.id,
            name: s.name,
            city: s.city,
          })),
        )
      if (rj.success && Array.isArray(rj.data?.refunds)) setRefundsList(rj.data.refunds)
      if (poj.success && Array.isArray(poj.data?.payouts)) setPayoutsList(poj.data.payouts)
      if (vuj.success && Array.isArray(vuj.data?.users)) {
        const vlist = (vuj.data.users as { id: string; name: string; email: string }[]).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
        }))
        setVendorsForPayout(vlist)
        setPayoutVendorId((prev) => prev || vlist[0]?.id || "")
      }
    } catch (e) {
      console.error("[OrderFinanceView]", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!manualStore) {
      setProducts([])
      return
    }
    fetch(`/api/products?storeId=${encodeURIComponent(manualStore)}&limit=100`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data?.products))
          setProducts(
            (d.data.products as { id: string; name: string; price: number }[]).map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
            })),
          )
      })
      .catch(() => setProducts([]))
  }, [manualStore])

  const totals = useMemo(() => {
    const subtotal = manualLines.reduce((acc, line) => acc + line.price * Math.max(1, line.quantity), 0)
    const total = subtotal + (Number.isFinite(manualFee) ? manualFee : 0)
    return { subtotal, total }
  }, [manualLines, manualFee])

  const openDetail = async (id: string) => {
    setDetailId(id)
    setDetailLoading(true)
    setPatchStatus("")
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, { credentials: "include" })
      const data = await res.json()
      if (data.success && data.data?.order) {
        setDetail(data.data.order)
        setPatchStatus(String(data.data.order.status ?? ""))
      } else setDetail(null)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const applyPatch = async () => {
    if (!detailId || !patchStatus) return
    setPatching(true)
    try {
      const res = await fetchWithCsrf(`/api/admin/orders/${encodeURIComponent(detailId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: patchStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Statut mis à jour" })
        await onRefreshOrders()
        await openDetail(detailId)
        await refresh()
      } else toast({ title: "Erreur", description: apiErrorMessage(data.error, "Erreur"), variant: "destructive" })
    } catch {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setPatching(false)
    }
  }

  const submitRefund = async () => {
    if (!refundOrderId.trim() || refundReason.trim().length < 10) {
      toast({
        title: "Champs requis",
        description: "orderId + motif (≥10 caractères)",
        variant: "destructive",
      })
      return
    }
    setRefunding(true)
    try {
      const body: Record<string, unknown> = {
        orderId: refundOrderId.trim(),
        reason: refundReason,
      }
      const amt = parseFloat(refundAmount)
      if (!Number.isNaN(amt) && amt > 0) body.amount = amt
      const res = await fetchWithCsrf(`/api/admin/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Remboursement créé", description: `Statut ${(data.data as any)?.refund?.status ?? "PENDING"}` })
        setRefundReason("")
        setRefundAmount("")
        await refresh()
      } else toast({ title: "Erreur", description: apiErrorMessage(data.error, "Erreur"), variant: "destructive" })
    } catch {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setRefunding(false)
    }
  }

  const addLine = () => setManualLines((rows) => [...rows, { productId: "", quantity: 1, price: 0 }])

  const downloadPayoutCsv = async () => {
    try {
      const res = await fetch("/api/admin/finance/payouts?format=csv", { credentials: "include" })
      if (!res.ok) throw new Error("Export CSV refusé")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `vendor-payouts-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: "CSV téléchargé" })
    } catch {
      toast({ title: "Export CSV impossible", variant: "destructive" })
    }
  }

  const submitPayoutRow = async () => {
    const gross = parseFloat(payoutGross)
    const fees = parseFloat(payoutFees) || 0
    const net = parseFloat(payoutNet)
    if (!payoutVendorId || !payoutPeriod.trim()) {
      toast({ title: "Vendeur et période obligatoires", variant: "destructive" })
      return
    }
    if (Number.isNaN(gross) || gross < 0 || Number.isNaN(fees) || fees < 0 || Number.isNaN(net)) {
      toast({ title: "Montants invalides", variant: "destructive" })
      return
    }
    if (Math.abs(net - (gross - fees)) >= 0.02) {
      toast({
        title: "Net incohérent",
        description: "Le net doit égaler brut − frais (tolérance 0,01).",
        variant: "destructive",
      })
      return
    }
    setPayoutBusy(true)
    try {
      const res = await fetchWithCsrf("/api/admin/finance/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: payoutVendorId,
          periodLabel: payoutPeriod.trim(),
          grossAmount: gross,
          feesAmount: fees,
          netAmount: net,
          status: payoutStatus,
          etaLabel: payoutEta.trim() || "—",
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Ligne payout enregistrée" })
        setPayoutPeriod("")
        setPayoutGross("")
        setPayoutFees("0")
        setPayoutNet("")
        await refresh()
      } else toast({ title: "Erreur", description: apiErrorMessage(data.error, "Erreur"), variant: "destructive" })
    } catch {
      toast({ title: "Erreur enregistrement", variant: "destructive" })
    } finally {
      setPayoutBusy(false)
    }
  }

  const submitManualOrder = async () => {
    if (!manualCustomer || !manualStore) {
      toast({ title: "Client et magasin obligatoires", variant: "destructive" })
      return
    }
    const filled = manualLines.filter((l) => l.productId && l.quantity >= 1 && l.price > 0)
    if (filled.length === 0) {
      toast({ title: "Ajoutez au moins une ligne article valide", variant: "destructive" })
      return
    }
    if (manualAddress.trim().length < 10) {
      toast({ title: "Adresse trop courte", description: "Au moins 10 caractères.", variant: "destructive" })
      return
    }
    if (!manualPhone.match(/^0[567]\d{8}$/)) {
      toast({ title: "Téléphone DZ invalide", description: "Format 0[567…] 10 ch.", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetchWithCsrf(`/api/admin/orders/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: manualCustomer,
          storeId: manualStore,
          items: filled.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })),
          subtotal: totals.subtotal,
          deliveryFee: manualFee,
          total: totals.total,
          paymentMethod: manualPay,
          deliveryAddress: manualAddress.trim(),
          city: manualCity.trim() || "Alger",
          customerPhone: manualPhone.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Commande créée", description: (data.data as any)?.order?.id?.slice?.(0, 12) ?? "" })
        setManualLines([{ productId: "", quantity: 1, price: 0 }])
        await onRefreshOrders()
        await refresh()
      } else toast({ title: "Erreur", description: apiErrorMessage(data.error, "Erreur"), variant: "destructive" })
    } catch {
      toast({ title: "Erreur création commande", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            ["Commandes", String(summary.totalOrders)],
            ["Livrées", String(summary.deliveredOrders)],
            ["CA livré (DZD)", Math.round(summary.revenueDelivered).toString()],
            ["Remb. en attente", String(summary.pendingRefundsCount)],
            ["Remb. (DZD agr.)", Math.round(summary.refundsAmountApprovedOrCompleted).toString()],
          ].map(([k, v]) => (
            <Card key={k}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-lg font-semibold tabular-nums">{v}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Remboursements récents
          </CardTitle>
          <CardDescription>Liste des derniers dossiers créés sous /api/admin/refunds.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          {refundsList.length === 0 ? (
            <p className="text-muted-foreground">Aucun remboursement</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b text-left bg-muted/50">
                  <th className="p-2">Commande</th>
                  <th className="p-2">Montant</th>
                  <th className="p-2">Statut</th>
                  <th className="p-2">Motif</th>
                </tr>
              </thead>
              <tbody>
                {refundsList.slice(0, 15).map((r: any) => (
                  <tr key={String(r.id)} className="border-b border-border">
                    <td className="p-2 font-mono text-xs">{String(r.order?.id ?? r.orderId).slice(0, 14)}…</td>
                    <td className="p-2 tabular-nums">{r.amount as number}</td>
                    <td className="p-2">
                      <Badge variant="outline">{String(r.status)}</Badge>
                    </td>
                    <td className="p-2 max-w-[200px] truncate">{String(r.reason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Ledger payouts vendeurs
            </CardTitle>
            <CardDescription>
              Liste `VendorPayout` — export CSV pour la compta, saisie manuelle d&apos;une ligne (audit financier).
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void downloadPayoutCsv()}>
            Télécharger CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {payoutsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ligne de payout.</p>
          ) : (
            <div className="overflow-x-auto text-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b text-left bg-muted/50">
                    <th className="p-2">Période</th>
                    <th className="p-2">Vendeur</th>
                    <th className="p-2 text-right">Net</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2">Créée</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutsList.slice(0, 25).map((p: any) => (
                    <tr key={String(p.id)} className="border-b border-border">
                      <td className="p-2 max-w-[140px] truncate">{String(p.periodLabel)}</td>
                      <td className="p-2 text-xs">
                        {(p.vendor as any)?.name ?? "—"} <span className="text-muted-foreground">{(p.vendor as any)?.email}</span>
                      </td>
                      <td className="p-2 text-right tabular-nums">{Number(p.netAmount).toFixed(2)}</td>
                      <td className="p-2">
                        <Badge variant="outline">{String(p.status)}</Badge>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{String(p.createdAt ?? "").slice(0, 19)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 max-w-3xl border-t pt-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Vendeur</Label>
              <Select value={payoutVendorId} onValueChange={setPayoutVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {vendorsForPayout.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} · {v.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Libellé période</Label>
              <Input value={payoutPeriod} onChange={(e) => setPayoutPeriod(e.target.value)} placeholder="Ex. Semaine 2026-W18" />
            </div>
            <div className="space-y-2">
              <Label>Brut (DZD)</Label>
              <Input
                type="number"
                value={payoutGross}
                onChange={(e) => {
                  const g = e.target.value
                  setPayoutGross(g)
                  const gf = parseFloat(g)
                  const ff = parseFloat(payoutFees) || 0
                  if (!Number.isNaN(gf)) setPayoutNet(String(Math.round((gf - ff) * 100) / 100))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Frais (DZD)</Label>
              <Input
                type="number"
                value={payoutFees}
                onChange={(e) => {
                  const f = e.target.value
                  setPayoutFees(f)
                  const gf = parseFloat(payoutGross)
                  const ff = parseFloat(f) || 0
                  if (!Number.isNaN(gf)) setPayoutNet(String(Math.round((gf - ff) * 100) / 100))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Net (DZD)</Label>
              <Input type="number" value={payoutNet} onChange={(e) => setPayoutNet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Statut (libre)</Label>
              <Input value={payoutStatus} onChange={(e) => setPayoutStatus(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ETA / note</Label>
              <Input value={payoutEta} onChange={(e) => setPayoutEta(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button type="button" disabled={payoutBusy} onClick={() => void submitPayoutRow()}>
                {payoutBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer la ligne"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demandes de remboursement</CardTitle>
          <CardDescription>Commande avec enregistrement paiement uniquement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div>
            <Label>ID commande</Label>
            <Input value={refundOrderId} onChange={(e) => setRefundOrderId(e.target.value)} placeholder="cuid…" />
          </div>
          <div>
            <Label>Montant partiel (optionnel)</Label>
            <Input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Vide = total paiement"
            />
          </div>
          <div>
            <Label>Motif (≥10)</Label>
            <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          </div>
          <Button disabled={refunding} onClick={() => void submitRefund()} type="button">
            {refunding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Soumettre remboursement"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Création manuelle</CardTitle>
          <CardDescription>Commande créée comme PENDING avec client choisi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 max-w-3xl">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={manualCustomer} onValueChange={setManualCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Magasin</Label>
              <Select value={manualStore} onValueChange={(v) => setManualStore(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Lignes</Label>
            {manualLines.map((line, idx) => (
              <div key={`line-${idx}`} className="flex flex-wrap gap-2 items-end border rounded-lg p-3">
                <Select
                  value={line.productId}
                  onValueChange={(productId) => {
                    const p = products.find((x) => x.id === productId)
                    const price = p?.price ?? 0
                    setManualLines((rows) =>
                      rows.map((row, i) => (i === idx ? { ...row, productId, price } : row)),
                    )
                  }}
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Produit…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.price} DZD)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  value={line.quantity}
                  onChange={(e) =>
                    setManualLines((rows) =>
                      rows.map((row, i) =>
                        i === idx ? { ...row, quantity: Math.max(1, parseInt(e.target.value) || 1) } : row,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addLine}>
              <Plus className="w-4 h-4 mr-1" /> Ligne article
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Adresse livraison (≥10 car.)</Label>
              <Input value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} />
            </div>
            <div>
              <Label>Ville</Label>
              <Input value={manualCity} onChange={(e) => setManualCity(e.target.value)} />
            </div>
            <div>
              <Label>Téléphone client (0…)</Label>
              <Input value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Frais livraison (DZD)</Label>
              <Input
                type="number"
                value={manualFee}
                onChange={(e) => setManualFee(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Paiement</Label>
              <Select value={manualPay} onValueChange={(v: "CASH" | "CARD" | "WALLET") => setManualPay(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="CARD">Carte</SelectItem>
                  <SelectItem value="WALLET">Portefeuille</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm pb-2">
              Sous-total : <strong>{totals.subtotal.toFixed(0)}</strong> · Total{" "}
              <strong>{totals.total.toFixed(0)} DZD</strong>
            </p>
          </div>
          <Button disabled={creating} type="button" onClick={() => void submitManualOrder()}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer la commande"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestion commandes</CardTitle>
          <CardDescription>Cliquez sur une commande pour ouvrir le détail et modifier le statut.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Statut</th>
                <th className="text-right p-2">Total</th>
                <th className="text-left p-2">Créée</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 80).map((o) => (
                <tr
                  key={o.id}
                  className="border-b hover:bg-muted/40 cursor-pointer"
                  onClick={() => void openDetail(o.id)}
                >
                  <td className="p-2 font-mono">{o.id.slice(0, 12)}…</td>
                  <td className="p-2">{o.status && <Badge variant="outline">{o.status}</Badge>}</td>
                  <td className="text-right p-2 tabular-nums">{o.total ?? "—"}</td>
                  <td className="p-2 text-muted-foreground text-xs">{String(o.createdAt ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail commande</DialogTitle>
            <DialogDescription>Outils admin — PATCH statut uniquement depuis ce panneau.</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <Loader2 className="animate-spin mx-auto h-8 w-8" />
          ) : detail ? (
            <div className="space-y-3 text-sm">
              <p>
                ID : <span className="font-mono text-xs">{detail.id}</span>
              </p>
              <p>Client : {(detail.customer as any)?.name}</p>
              <p>Livraison : {detail.city} — {(detail.customer as any)?.phone}</p>
              {detail.payment ? (
                <p>
                  Paiement : {(detail.payment as any).amount} DZD · {(detail.payment as any).status}
                </p>
              ) : (
                <p className="text-muted-foreground">Pas encore de paiement enregistré</p>
              )}
              {detail.refund ? (
                <p className="text-amber-700">Remboursement : {(detail.refund as any).status}</p>
              ) : null}

              <div className="flex gap-2 items-center pt-2">
                <Label>Statut</Label>
                <Select value={patchStatus || String(detail.status)} onValueChange={setPatchStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDetailId(null)}>
                  Fermer
                </Button>
                <Button
                  type="button"
                  disabled={patching || !patchStatus}
                  onClick={() => void applyPatch()}
                  className="gap-2"
                >
                  {patching ? <Loader2 className="animate-spin h-4 w-4" /> : "Enregistrer statut"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setRefundOrderId(String(detail.id))
                    setDetailId(null)
                  }}
                >
                  Pré-remplacer remboursement
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <p className="text-destructive">Commande introuvable</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
