"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Badge } from "@/root/components/ui/badge"
import { QrCode, Trash2, RefreshCw } from "lucide-react"
import { electronFetch } from "@/lib/electron-fetch"

type GuestTable = { id: string; label: string; createdAt: number }

type GuestOrder = {
  id: string
  tableId: string
  tableLabel: string
  status: string
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  total: number
  note?: string
  createdAt: number
}

interface DineQrTabProps {
  translate: (fr: string, ar: string) => string
}

async function parseJson(res: Response) {
  const j = await res.json().catch(() => null)
  const data = j?.data ?? j
  return { ok: res.ok, data, err: j?.error?.message || j?.message }
}

export function DineQrTab({ translate }: DineQrTabProps) {
  const [tables, setTables] = useState<GuestTable[]>([])
  const [orders, setOrders] = useState<GuestOrder[]>([])
  const [label, setLabel] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [tRes, oRes] = await Promise.all([
        electronFetch("/api/vendor/restaurant/tables"),
        electronFetch("/api/vendor/restaurant/guest-orders?status=PENDING"),
      ])
      const t = await parseJson(tRes)
      const o = await parseJson(oRes)
      if (!t.ok) setError(t.err || "Tables")
      else setTables(Array.isArray(t.data?.tables) ? t.data.tables : [])
      if (!o.ok) setError(o.err || "Orders")
      else setOrders(Array.isArray(o.data?.orders) ? o.data.orders : [])
    } catch (e: any) {
      setError(e?.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 8000)
    return () => window.clearInterval(id)
  }, [refresh])

  const addTable = async () => {
    if (!label.trim()) return
    setError("")
    const res = await electronFetch("/api/vendor/restaurant/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    })
    const { ok, data, err } = await parseJson(res)
    if (!ok) {
      setError(err || "Erreur")
      return
    }
    setLabel("")
    if (data?.table) setTables((prev) => [...prev, data.table])
    else void refresh()
  }

  const removeTable = async (id: string) => {
    const res = await electronFetch(`/api/vendor/restaurant/tables?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
    const { ok, err } = await parseJson(res)
    if (!ok) {
      setError(err || "Erreur")
      return
    }
    setTables((prev) => prev.filter((t) => t.id !== id))
  }

  const setOrderStatus = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    const res = await electronFetch("/api/vendor/restaurant/guest-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    const { ok, err } = await parseJson(res)
    if (!ok) {
      setError(err || "Erreur")
      return
    }
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  const origin = typeof window !== "undefined" ? window.location.origin : ""

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="w-7 h-7" />
          {translate("QR tables & invités", "طاولات QR والضيوف")}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {translate("Actualiser", "تحديث")}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-red-600 border border-red-200 rounded-md px-3 py-2 bg-red-50">{error}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{translate("Tables", "الطاولات")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {translate(
              "Créez une table puis ouvrez le lien menu sur le téléphone du client (même réseau Wi‑Fi que ce PC, ou scan du QR encodant l’URL).",
              "أنشئ طاولة ثم افتح رابط القائمة على هاتف الزبون (نفس شبكة الـ Wi‑Fi لهذا الجهاز).",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              placeholder={translate("Nom (ex. Table 5)", "اسم (مثلاً طاولة 5)")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Button type="button" onClick={() => void addTable()}>
              {translate("Ajouter", "إضافة")}
            </Button>
          </div>
          <ul className="space-y-3">
            {tables.map((t) => {
              const url = `${origin}/guest/menu?tableId=${encodeURIComponent(t.id)}`
              return (
                <li key={t.id} className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground break-all">{url}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(url)}>
                      {translate("Copier lien", "نسخ الرابط")}
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => void removeTable(t.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("Commandes invitées (en attente)", "طلبات الضيوف (معلقة)")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{translate("Aucune commande.", "لا طلبات.")}</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {o.tableLabel}{" "}
                    <Badge variant="secondary">{new Date(o.createdAt).toLocaleTimeString()}</Badge>
                  </span>
                  <span className="text-sm font-semibold">{Number(o.total).toFixed(2)} DA</span>
                </div>
                <ul className="text-sm text-muted-foreground list-disc pl-5">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      {it.quantity}× {it.name}
                    </li>
                  ))}
                </ul>
                {o.note ? <p className="text-xs italic">{o.note}</p> : null}
                <div className="flex gap-2">
                  <Button size="sm" className="bg-teal-600" onClick={() => void setOrderStatus(o.id, "ACCEPTED")}>
                    {translate("Accepter", "قبول")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void setOrderStatus(o.id, "REJECTED")}>
                    {translate("Refuser", "رفض")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
