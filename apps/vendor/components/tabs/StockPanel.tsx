"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Input } from "@/root/components/ui/input"
import { Badge } from "@/root/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import type { FlatItem, StockCount, StockMovementRow } from "../../electron/shared/ipc"
import { dinars, engine, engineInventory } from "../../lib/engine"
import type { InventoryProduct } from "@/root/lib/types"

interface StockPanelProps {
  translate: (fr: string, ar: string) => string
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  /** Called after any stock change so the inventory list and alerts refresh. */
  onChanged: (products: InventoryProduct[]) => void
}

type DeliveryLine = { variantId: string; name: string; qty: string; unitCost: string }

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** Finds an item by exact barcode/SKU first, then by name. */
function findItems(items: FlatItem[], query: string): FlatItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const exact = items.filter((i) => i.barcode.toLowerCase() === q || i.sku.toLowerCase() === q)
  if (exact.length) return exact
  return items.filter((i) => i.displayName.toLowerCase().includes(q)).slice(0, 8)
}

/**
 * Desktop app stock screen: supplier deliveries, shelf counts and the movement history.
 * Every number here comes from, and goes to, the local engine.
 */
export function StockPanel({ translate, toast, onChanged }: StockPanelProps) {
  const [items, setItems] = useState<FlatItem[]>([])
  const refresh = useCallback(async () => {
    setItems(await engine("catalog:items"))
    onChanged(await engineInventory())
  }, [onChanged])
  useEffect(() => {
    engine("catalog:items").then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <Tabs defaultValue="receive" className="space-y-4">
      <TabsList>
        <TabsTrigger value="receive">{translate("Réception", "استلام سلعة")}</TabsTrigger>
        <TabsTrigger value="count">{translate("Inventaire", "جرد")}</TabsTrigger>
        <TabsTrigger value="history">{translate("Mouvements", "الحركات")}</TabsTrigger>
      </TabsList>
      <TabsContent value="receive">
        <Delivery items={items} translate={translate} toast={toast} onDone={refresh} />
      </TabsContent>
      <TabsContent value="count">
        <Count translate={translate} toast={toast} onDone={refresh} />
      </TabsContent>
      <TabsContent value="history">
        <History translate={translate} />
      </TabsContent>
    </Tabs>
  )
}

function Delivery({ items, translate, toast, onDone }: { items: FlatItem[]; translate: StockPanelProps["translate"]; toast: StockPanelProps["toast"]; onDone: () => Promise<void> }) {
  const [supplier, setSupplier] = useState("")
  const [reference, setReference] = useState("")
  const [search, setSearch] = useState("")
  const [lines, setLines] = useState<DeliveryLine[]>([])
  // One id per delivery on screen: a double click or retry records it once.
  const [deliveryId, setDeliveryId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const matches = useMemo(() => findItems(items, search), [items, search])

  const add = (item: FlatItem) => {
    setLines((ls) => {
      const same = ls.find((l) => l.variantId === item.variantId)
      if (same) return ls.map((l) => (l === same ? { ...l, qty: String((Number(l.qty) || 0) + 1) } : l))
      return [...ls, { variantId: item.variantId, name: item.displayName, qty: "1", unitCost: String(item.costPrice) }]
    })
    setSearch("")
  }
  const total = lines.reduce((s, l) => s + dinars(l.qty) * dinars(l.unitCost), 0)

  const save = async () => {
    setBusy(true)
    try {
      const r = await engine("stock:receive", {
        id: deliveryId,
        supplierName: supplier,
        reference,
        lines: lines.filter((l) => dinars(l.qty) > 0).map((l) => ({ variantId: l.variantId, qty: dinars(l.qty), unitCost: dinars(l.unitCost) })),
      })
      toast({ title: translate("Réception enregistrée", "تم تسجيل الاستلام"), description: translate(`${r.units} unités · ${r.totalCost} DA`, `${r.units} قطعة · ${r.totalCost} د.ج`) })
      setLines([])
      setReference("")
      setDeliveryId(crypto.randomUUID())
      await onDone()
    } catch (e) {
      toast({ title: translate("Réception non enregistrée", "لم يتم تسجيل الاستلام"), description: errorText(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>{translate("Réception fournisseur", "استلام من المورد")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder={translate("Fournisseur", "المورد")} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          <Input placeholder={translate("N° bon de livraison", "رقم وصل التسليم")} value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
        <div className="relative">
          <Input
            data-testid="stock-search"
            placeholder={translate("Scanner ou chercher un produit…", "امسح أو ابحث عن منتج…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches.length === 1) {
                e.preventDefault()
                add(matches[0]!)
              }
            }}
          />
          {matches.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow">
              {matches.map((m) => (
                <button key={m.variantId} type="button" className="block w-full px-3 py-2 text-start hover:bg-muted" onClick={() => add(m)}>
                  {m.displayName} <span className="text-muted-foreground text-xs">{m.sku} · {translate("stock", "المخزون")} {m.stock}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {lines.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Produit", "المنتج")}</TableHead>
                <TableHead>{translate("Quantité", "الكمية")}</TableHead>
                <TableHead>{translate("Coût unitaire (DA)", "سعر الشراء (د.ج)")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.variantId}>
                  <TableCell>{l.name}</TableCell>
                  <TableCell><Input className="w-24" inputMode="numeric" value={l.qty} onChange={(e) => setLines((ls) => ls.map((x) => (x === l ? { ...x, qty: e.target.value.replace(/\D/g, "") } : x)))} /></TableCell>
                  <TableCell><Input className="w-32" inputMode="numeric" value={l.unitCost} onChange={(e) => setLines((ls) => ls.map((x) => (x === l ? { ...x, unitCost: e.target.value.replace(/\D/g, "") } : x)))} /></TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => setLines((ls) => ls.filter((x) => x !== l))}>✕</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{translate("Total", "المجموع")}: <strong>{total} DA</strong></span>
          <Button disabled={busy || lines.length === 0} onClick={save}>{translate("Enregistrer la réception", "تسجيل الاستلام")}</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Count({ translate, toast, onDone }: { translate: StockPanelProps["translate"]; toast: StockPanelProps["toast"]; onDone: () => Promise<void> }) {
  const [count, setCount] = useState<StockCount | null>(null)
  const [filter, setFilter] = useState("")
  const [busy, setBusy] = useState(false)
  const load = useCallback(() => engine("stock:countOpen").then(setCount), [])
  useEffect(() => {
    load().catch(() => setCount(null))
  }, [load])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      toast({ title: translate("Erreur", "خطأ"), description: errorText(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  if (!count) {
    return (
      <Card>
        <CardHeader><CardTitle>{translate("Inventaire physique", "الجرد الفعلي")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {translate(
              "Comptez ce qui est en rayon. Seuls les produits comptés sont corrigés à la fin ; les ventes pendant le comptage sont prises en compte.",
              "عُدّ ما هو موجود في الرفوف. تُصحَّح المنتجات المعدودة فقط عند الإنهاء، والمبيعات أثناء الجرد محسوبة.",
            )}
          </p>
          <Button disabled={busy} onClick={() => run(async () => setCount(await engine("stock:countStart", { note: "" })))}>
            {translate("Commencer un inventaire", "بدء الجرد")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const counted = count.lines.filter((l) => l.counted !== null)
  const differences = counted.filter((l) => l.counted !== l.stockNow)
  const shown = count.lines.filter((l) => {
    const q = filter.trim().toLowerCase()
    return !q || l.name.toLowerCase().includes(q) || l.sku.toLowerCase() === q || l.barcode === q
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {translate("Inventaire en cours", "جرد جارٍ")} · {counted.length}/{count.lines.length} {translate("comptés", "معدود")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder={translate("Filtrer ou scanner…", "تصفية أو مسح…")} value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translate("Produit", "المنتج")}</TableHead>
              <TableHead>{translate("Système", "النظام")}</TableHead>
              <TableHead>{translate("Compté", "المعدود")}</TableHead>
              <TableHead>{translate("Écart", "الفرق")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((l) => (
              <TableRow key={l.variantId}>
                <TableCell>{l.name}<div className="text-xs text-muted-foreground">{l.sku}</div></TableCell>
                <TableCell>{l.stockNow}</TableCell>
                <TableCell>
                  <Input
                    className="w-24"
                    inputMode="numeric"
                    defaultValue={l.counted ?? ""}
                    onBlur={(e) => {
                      const raw = e.target.value.replace(/\D/g, "")
                      const value = raw === "" ? null : Number(raw)
                      if (value === l.counted) return
                      void run(async () => {
                        await engine("stock:countSet", { countId: count.id, variantId: l.variantId, counted: value })
                        await load()
                      })
                    }}
                  />
                </TableCell>
                <TableCell>
                  {l.counted !== null && l.counted !== l.stockNow && (
                    <Badge variant={l.counted < l.stockNow ? "destructive" : "secondary"}>{l.counted - l.stockNow > 0 ? "+" : ""}{l.counted - l.stockNow}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{differences.length} {translate("écart(s) à corriger", "فروق للتصحيح")}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={() => run(async () => {
              if (!window.confirm(translate("Annuler cet inventaire ? Rien ne sera modifié.", "إلغاء هذا الجرد؟ لن يتغير شيء."))) return
              await engine("stock:countCancel", { countId: count.id })
              setCount(null)
            })}>{translate("Annuler", "إلغاء")}</Button>
            <Button disabled={busy || counted.length === 0} onClick={() => run(async () => {
              if (!window.confirm(translate(`Corriger ${differences.length} produit(s) ?`, `تصحيح ${differences.length} منتج؟`))) return
              const r = await engine("stock:countFinish", { countId: count.id })
              toast({ title: translate("Inventaire terminé", "انتهى الجرد"), description: translate(`${r.adjusted} produits corrigés (${r.unitsDelta >= 0 ? "+" : ""}${r.unitsDelta})`, `تم تصحيح ${r.adjusted} منتج (${r.unitsDelta >= 0 ? "+" : ""}${r.unitsDelta})`) })
              setCount(null)
              await onDone()
            })}>{translate("Terminer et corriger", "إنهاء وتصحيح")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const MOVE_LABEL: Record<StockMovementRow["type"], [string, string]> = {
  SALE: ["Vente", "بيع"],
  RETURN: ["Retour", "إرجاع"],
  RECEIVE: ["Réception", "استلام"],
  ADJUST: ["Correction", "تصحيح"],
  DAMAGE: ["Casse", "تلف"],
}

function History({ translate }: { translate: StockPanelProps["translate"] }) {
  const [rows, setRows] = useState<StockMovementRow[]>([])
  useEffect(() => {
    engine("stock:movements", { limit: 200 }).then(setRows).catch(() => setRows([]))
  }, [])
  return (
    <Card>
      <CardHeader><CardTitle>{translate("Mouvements de stock", "حركات المخزون")}</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translate("Date", "التاريخ")}</TableHead>
              <TableHead>{translate("Produit", "المنتج")}</TableHead>
              <TableHead>{translate("Type", "النوع")}</TableHead>
              <TableHead>{translate("Qté", "الكمية")}</TableHead>
              <TableHead>{translate("Détail", "التفاصيل")}</TableHead>
              <TableHead>{translate("Par", "بواسطة")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell>{translate(...MOVE_LABEL[m.type])}</TableCell>
                <TableCell className={m.delta < 0 ? "text-red-600" : "text-green-700"}>{m.delta > 0 ? "+" : ""}{m.delta}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{[m.saleNumber, m.supplier, m.reference, m.reason].filter(Boolean).join(" · ")}</TableCell>
                <TableCell>{m.user}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
