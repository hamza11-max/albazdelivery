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
import { useAdminI18n } from "../lib/AdminI18nProvider"

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
  const { t, language } = useAdminI18n()
  const dateLocale = language === "ar" ? "ar-DZ" : "fr-FR"
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
  const [payoutEta, setPayoutEta] = useState("")
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
        toast({ title: t("finance.statusUpdated") })
        await onRefreshOrders()
        await openDetail(detailId)
        await refresh()
      } else
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("common.error")),
          variant: "destructive",
        })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setPatching(false)
    }
  }

  const submitRefund = async () => {
    if (!refundOrderId.trim() || refundReason.trim().length < 10) {
      toast({
        title: t("finance.requiredFields"),
        description: t("finance.refundFieldsHint"),
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
        toast({
          title: t("common.success"),
          description: t("finance.refundCreated", undefined, undefined, {
            status: String((data.data as any)?.refund?.status ?? "PENDING"),
          }),
        })
        setRefundReason("")
        setRefundAmount("")
        await refresh()
      } else
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("common.error")),
          variant: "destructive",
        })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setRefunding(false)
    }
  }

  const addLine = () => setManualLines((rows) => [...rows, { productId: "", quantity: 1, price: 0 }])

  const downloadPayoutCsv = async () => {
    try {
      const res = await fetch("/api/admin/finance/payouts?format=csv", { credentials: "include" })
      if (!res.ok) throw new Error("csv")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `vendor-payouts-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: t("finance.csvDownloaded") })
    } catch {
      toast({ title: t("finance.csvExportFail"), variant: "destructive" })
    }
  }

  const submitPayoutRow = async () => {
    const gross = parseFloat(payoutGross)
    const fees = parseFloat(payoutFees) || 0
    const net = parseFloat(payoutNet)
    if (!payoutVendorId || !payoutPeriod.trim()) {
      toast({ title: t("finance.vendorPeriodRequired"), variant: "destructive" })
      return
    }
    if (Number.isNaN(gross) || gross < 0 || Number.isNaN(fees) || fees < 0 || Number.isNaN(net)) {
      toast({ title: t("finance.invalidAmounts"), variant: "destructive" })
      return
    }
    if (Math.abs(net - (gross - fees)) >= 0.02) {
      toast({
        title: t("finance.netMismatch"),
        description: t("finance.netMismatchDesc"),
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
        toast({ title: t("finance.payoutRowSaved") })
        setPayoutPeriod("")
        setPayoutGross("")
        setPayoutFees("0")
        setPayoutNet("")
        await refresh()
      } else
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("common.error")),
          variant: "destructive",
        })
    } catch {
      toast({ title: t("finance.savePayoutError"), variant: "destructive" })
    } finally {
      setPayoutBusy(false)
    }
  }

  const submitManualOrder = async () => {
    if (!manualCustomer || !manualStore) {
      toast({ title: t("finance.customerStoreRequired"), variant: "destructive" })
      return
    }
    const filled = manualLines.filter((l) => l.productId && l.quantity >= 1 && l.price > 0)
    if (filled.length === 0) {
      toast({ title: t("finance.addValidLine"), variant: "destructive" })
      return
    }
    if (manualAddress.trim().length < 10) {
      toast({
        title: t("finance.addressShort"),
        description: t("finance.addressShortDesc"),
        variant: "destructive",
      })
      return
    }
    if (!manualPhone.match(/^0[567]\d{8}$/)) {
      toast({
        title: t("finance.phoneDzInvalid"),
        description: t("finance.phoneDzHint"),
        variant: "destructive",
      })
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
        toast({
          title: t("finance.orderCreated"),
          description: (data.data as any)?.order?.id?.slice?.(0, 12) ?? "",
        })
        setManualLines([{ productId: "", quantity: 1, price: 0 }])
        await onRefreshOrders()
        await refresh()
      } else
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("common.error")),
          variant: "destructive",
        })
    } catch {
      toast({ title: t("finance.createOrderError"), variant: "destructive" })
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
          <RefreshCw className="h-4 w-4 mr-1" /> {t("common.refresh")}
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            [t("finance.summaryOrders"), String(summary.totalOrders)],
            [t("finance.summaryDelivered"), String(summary.deliveredOrders)],
            [t("finance.summaryRevenue"), Math.round(summary.revenueDelivered).toString()],
            [t("finance.summaryPendingRefunds"), String(summary.pendingRefundsCount)],
            [t("finance.summaryRefundsAgg"), Math.round(summary.refundsAmountApprovedOrCompleted).toString()],
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
            {t("finance.refundsRecentTitle")}
          </CardTitle>
          <CardDescription>{t("finance.refundsRecentDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          {refundsList.length === 0 ? (
            <p className="text-muted-foreground">{t("finance.noRefunds")}</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b text-left bg-muted/50">
                  <th className="p-2">{t("finance.thOrder")}</th>
                  <th className="p-2">{t("finance.thAmount")}</th>
                  <th className="p-2">{t("common.status")}</th>
                  <th className="p-2">{t("finance.thReason")}</th>
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
              {t("finance.payoutsLedgerTitle")}
            </CardTitle>
            <CardDescription>{t("finance.payoutsLedgerDesc")}</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void downloadPayoutCsv()}>
            {t("finance.downloadCsv")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {payoutsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("finance.noPayoutRows")}</p>
          ) : (
            <div className="overflow-x-auto text-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b text-left bg-muted/50">
                    <th className="p-2">{t("finance.thPeriod")}</th>
                    <th className="p-2">{t("finance.labelVendor")}</th>
                    <th className="p-2 text-right">{t("finance.thNet")}</th>
                    <th className="p-2">{t("common.status")}</th>
                    <th className="p-2">{t("finance.thCreated")}</th>
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
                      <td className="p-2 text-xs text-muted-foreground">
                        {p.createdAt
                          ? new Date(String(p.createdAt)).toLocaleString(dateLocale, {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 max-w-3xl border-t pt-6">
            <div className="space-y-2 md:col-span-2">
              <Label>{t("finance.labelVendor")}</Label>
              <Select value={payoutVendorId} onValueChange={setPayoutVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("finance.placeholderChoose")} />
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
              <Label>{t("finance.labelPeriod")}</Label>
              <Input
                value={payoutPeriod}
                onChange={(e) => setPayoutPeriod(e.target.value)}
                placeholder={t("finance.periodExamplePh")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("finance.labelGross")}</Label>
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
              <Label>{t("finance.labelFees")}</Label>
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
              <Label>{t("finance.labelNet")}</Label>
              <Input type="number" value={payoutNet} onChange={(e) => setPayoutNet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("finance.labelStatusFree")}</Label>
              <Input value={payoutStatus} onChange={(e) => setPayoutStatus(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("finance.labelEtaNote")}</Label>
              <Input
                value={payoutEta}
                onChange={(e) => setPayoutEta(e.target.value)}
                placeholder={t("finance.etaPlaceholder")}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="button" disabled={payoutBusy} onClick={() => void submitPayoutRow()}>
                {payoutBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("finance.savePayoutRow")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("finance.refundRequestsTitle")}</CardTitle>
          <CardDescription>{t("finance.refundRequestsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div>
            <Label>{t("finance.labelOrderId")}</Label>
            <Input value={refundOrderId} onChange={(e) => setRefundOrderId(e.target.value)} placeholder={t("finance.phOrderCuid")} />
          </div>
          <div>
            <Label>{t("finance.labelPartialAmount")}</Label>
            <Input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={t("finance.phFullPayment")}
            />
          </div>
          <div>
            <Label>{t("finance.labelReason10")}</Label>
            <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          </div>
          <Button disabled={refunding} onClick={() => void submitRefund()} type="button">
            {refunding ? <Loader2 className="h-4 w-4 animate-spin" /> : t("finance.submitRefund")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("finance.manualCreateTitle")}</CardTitle>
          <CardDescription>{t("finance.manualCreateDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 max-w-3xl">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("finance.labelCustomer")}</Label>
              <Select value={manualCustomer} onValueChange={setManualCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder={t("finance.placeholderSelect")} />
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
              <Label>{t("finance.labelStore")}</Label>
              <Select value={manualStore} onValueChange={(v) => setManualStore(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("finance.placeholderSelect")} />
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
            <Label>{t("finance.labelLines")}</Label>
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
                    <SelectValue placeholder={t("finance.placeholderProduct")} />
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
              <Plus className="w-4 h-4 mr-1" /> {t("finance.addLine")}
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>{t("finance.labelAddress")}</Label>
              <Input value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} />
            </div>
            <div>
              <Label>{t("common.city")}</Label>
              <Input value={manualCity} onChange={(e) => setManualCity(e.target.value)} />
            </div>
            <div>
              <Label>{t("finance.labelPhone")}</Label>
              <Input value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>{t("finance.labelDeliveryFee")}</Label>
              <Input
                type="number"
                value={manualFee}
                onChange={(e) => setManualFee(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>{t("finance.labelPayment")}</Label>
              <Select value={manualPay} onValueChange={(v: "CASH" | "CARD" | "WALLET") => setManualPay(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{t("finance.payCash")}</SelectItem>
                  <SelectItem value="CARD">{t("finance.payCard")}</SelectItem>
                  <SelectItem value="WALLET">{t("finance.payWallet")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm pb-2">
              {t("finance.totalsLine", undefined, undefined, {
                sub: totals.subtotal.toFixed(0),
                total: totals.total.toFixed(0),
              })}
            </p>
          </div>
          <Button disabled={creating} type="button" onClick={() => void submitManualOrder()}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t("finance.createOrder")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("finance.orderMgmtTitle")}</CardTitle>
          <CardDescription>{t("finance.orderMgmtDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">{t("finance.thId")}</th>
                <th className="text-left p-2">{t("common.status")}</th>
                <th className="text-right p-2">{t("finance.thTotal")}</th>
                <th className="text-left p-2">{t("finance.thCreated")}</th>
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
                  <td className="p-2 text-muted-foreground text-xs">
                    {o.createdAt
                      ? new Date(o.createdAt as string | Date).toLocaleString(dateLocale, {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("finance.detailTitle")}</DialogTitle>
            <DialogDescription>{t("finance.detailDesc")}</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <Loader2 className="animate-spin mx-auto h-8 w-8" />
          ) : detail ? (
            <div className="space-y-3 text-sm">
              <p>
                {t("finance.lblId")} : <span className="font-mono text-xs">{detail.id}</span>
              </p>
              <p>
                {t("common.client")} : {(detail.customer as any)?.name}
              </p>
              <p>
                {t("finance.lblDelivery")} : {detail.city} — {(detail.customer as any)?.phone}
              </p>
              {detail.payment ? (
                <p>
                  {t("finance.lblPayment")} : {(detail.payment as any).amount} DZD · {(detail.payment as any).status}
                </p>
              ) : (
                <p className="text-muted-foreground">{t("finance.noPaymentYet")}</p>
              )}
              {detail.refund ? (
                <p className="text-amber-700">
                  {t("finance.refundStatus")} : {(detail.refund as any).status}
                </p>
              ) : null}

              <div className="flex gap-2 items-center pt-2">
                <Label>{t("common.status")}</Label>
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
                  {t("common.close")}
                </Button>
                <Button
                  type="button"
                  disabled={patching || !patchStatus}
                  onClick={() => void applyPatch()}
                  className="gap-2"
                >
                  {patching ? <Loader2 className="animate-spin h-4 w-4" /> : t("finance.saveStatus")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setRefundOrderId(String(detail.id))
                    setDetailId(null)
                  }}
                >
                  {t("finance.prefillRefund")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <p className="text-destructive">{t("finance.orderNotFound")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
