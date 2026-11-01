"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Input } from "@/root/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/root/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import type { SaleDetail, ShiftClosed, ShiftStatus } from "../../electron/shared/ipc"
import { dinars, engine, enginePrintReceipt, EngineError } from "../../lib/engine"

type T = (fr: string, ar: string) => string

const da = (n: number) => `${n.toLocaleString("fr-FR")} DA`

/** Engine error codes a shop user can act on, in their words. */
function errorText(e: unknown, t: T): string {
  const code = e instanceof EngineError ? e.code : ""
  const known: Record<string, [string, string]> = {
    VOID_NEEDS_OWNER: ["Annulation : demandez au propriétaire ou au gérant.", "الإلغاء: اطلب من المالك أو المسير."],
    RETURN_NEEDS_OWNER: ["Retour hors délai : demandez au propriétaire ou au gérant.", "إرجاع بعد المهلة: اطلب من المالك أو المسير."],
    SHIFT_CLOSED: ["Seules les ventes de la caisse ouverte s'annulent ; faites un retour.", "تُلغى مبيعات الصندوق المفتوح فقط؛ قم بإرجاع."],
    NOT_ENOUGH_CASH: ["Pas assez d'espèces dans la caisse pour ce remboursement.", "لا يوجد نقد كافٍ في الصندوق لهذا الاسترجاع."],
    NOT_VOIDABLE: ["Cette vente ne peut pas être annulée.", "لا يمكن إلغاء هذا البيع."],
    NO_OPEN_SHIFT: ["Aucune caisse ouverte.", "لا يوجد صندوق مفتوح."],
  }
  const k = known[code]
  return k ? t(k[0], k[1]) : e instanceof Error ? e.message : String(e)
}

/** Desktop app: the open register, and closing it with the end-of-day (Z) report. */
export function RegisterBar({ translate: t, onChanged }: { translate: T; onChanged: () => void }) {
  const [status, setStatus] = useState<ShiftStatus | null>(null)
  const [closed, setClosed] = useState<ShiftClosed | null>(null)
  const [error, setError] = useState("")
  const load = useCallback(() => engine("shift:status").then(setStatus).catch(() => setStatus(null)), [])
  useEffect(() => { void load() }, [load])

  const close = async () => {
    setError("")
    const counted = window.prompt(t("Espèces comptées dans la caisse (DA)", "النقد المعدود في الصندوق (د.ج)"), status && status.open && status.expectedCash !== null ? String(status.expectedCash) : "")
    if (counted === null) return
    try {
      let result: ShiftClosed
      try {
        result = await engine("shift:close", { countedCash: dinars(counted), reason: "" })
      } catch (e) {
        if (!(e instanceof EngineError && e.code === "REASON_REQUIRED")) throw e
        const reason = window.prompt(t(`Écart de ${e.message} DA : raison ?`, `فرق ${e.message} د.ج: السبب؟`))
        if (!reason) return
        result = await engine("shift:close", { countedCash: dinars(counted), reason })
      }
      setClosed(result)
      engine("shift:printZ", { shiftId: result.id }).catch(() => {})
      await load()
      onChanged()
    } catch (e) {
      setError(errorText(e, t))
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4" data-testid="register-bar">
        <div className="text-sm">
          {status?.open ? (
            <>
              <Badge className="mr-2">{t("Caisse ouverte", "الصندوق مفتوح")}</Badge>
              {t("depuis", "منذ")} {new Date(status.openedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {status.salesCount} {t("ventes", "مبيعات")} · {da(status.salesTotal)}
              {status.expectedCash !== null && <> · {t("espèces attendues", "النقد المتوقع")} {da(status.expectedCash)}</>}
            </>
          ) : (
            <span className="text-muted-foreground">{t("Caisse fermée (elle s'ouvre à la première vente)", "الصندوق مغلق (يُفتح مع أول بيع)")}</span>
          )}
        </div>
        {status?.open && <Button variant="outline" onClick={close}>{t("Clôturer la caisse (Z)", "إغلاق الصندوق (Z)")}</Button>}
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </CardContent>
      <Dialog open={closed !== null} onOpenChange={(o) => !o && setClosed(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Rapport Z", "تقرير Z")}</DialogTitle></DialogHeader>
          {closed && (
            <div className="space-y-1 text-sm" data-testid="z-report">
              {([
                [t("Ventes", "المبيعات"), `${closed.salesCount} · ${da(closed.salesTotal)}`],
                [t("Retours", "المرتجعات"), `${closed.returnsCount} · ${da(closed.returnsTotal)}`],
                [t("Annulations", "الإلغاءات"), `${closed.voidsCount} · ${da(closed.voidsTotal)}`],
                [t("Carte", "بطاقة"), da(closed.cardTotal)],
                [t("Fond de caisse", "رصيد البداية"), da(closed.openingFloat)],
                [t("Entrées / sorties", "مداخيل / مصاريف"), `${da(closed.cashIn)} / ${da(closed.cashOut)}`],
                [t("Espèces attendues", "النقد المتوقع"), da(closed.expectedCash)],
                [t("Espèces comptées", "النقد المعدود"), da(closed.countedCash)],
                [t("Écart", "الفرق"), `${closed.difference > 0 ? "+" : ""}${da(closed.difference)}${closed.differenceReason ? ` · ${closed.differenceReason}` : ""}`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/** Desktop app: one sale's lines, with a partial return and a void. */
export function SaleDetailDialog({ saleId, translate: t, onClose, onChanged }: { saleId: string | null; translate: T; onClose: () => void; onChanged: () => void }) {
  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [qty, setQty] = useState<Record<string, string>>({})
  const [refundMethod, setRefundMethod] = useState<"CASH" | "CARD_EXTERNAL" | "CREDIT">("CASH")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const load = useCallback(async (id: string) => {
    const d = await engine("sales:detail", { id })
    setSale(d)
    setQty({})
    setRefundMethod(d.customer && d.payments.some((p) => p.method === "CREDIT") ? "CREDIT" : "CASH")
  }, [])
  useEffect(() => {
    setError("")
    if (saleId) load(saleId).catch((e) => setError(errorText(e, t)))
    else setSale(null)
  }, [saleId, load, t])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError("")
    try {
      await fn()
      onChanged()
    } catch (e) {
      setError(errorText(e, t))
    } finally {
      setBusy(false)
    }
  }

  const lines = sale?.lines.map((l) => ({ ...l, returnable: l.qty - l.returnedQty })) ?? []
  const chosen = lines.map((l) => ({ lineId: l.lineId, qty: Math.min(l.returnable, dinars(qty[l.lineId])) })).filter((l) => l.qty > 0)
  const refund = chosen.reduce((s, c) => { const l = lines.find((x) => x.lineId === c.lineId)!; return s + Math.round((l.net / l.qty) * c.qty) }, 0)

  return (
    <Dialog open={saleId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {sale ? `${sale.type === "RETURN" ? t("Retour", "إرجاع") : t("Vente", "بيع")} ${sale.number}` : "…"}
            {sale?.status === "VOIDED" && <Badge variant="destructive" className="ml-2">{t("Annulée", "ملغاة")}</Badge>}
          </DialogTitle>
        </DialogHeader>
        {sale && (
          <div className="space-y-4" data-testid="sale-detail">
            <p className="text-sm text-muted-foreground">
              {new Date(sale.createdAt).toLocaleString("fr-FR")} · {sale.cashier}
              {sale.customer && <> · {t("Client", "العميل")} {sale.customer.name}</>}
              {sale.originalNumber && <> · {t("retour de", "إرجاع لـ")} {sale.originalNumber}</>}
              {sale.voided && <> · {t("annulée", "ملغاة")}: {sale.voided.reason}</>}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Article", "الصنف")}</TableHead>
                  <TableHead>{t("Qté", "الكمية")}</TableHead>
                  <TableHead>{t("Payé", "المدفوع")}</TableHead>
                  {sale.canReturn && <TableHead>{t("À retourner", "للإرجاع")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.lineId}>
                    <TableCell>{l.name}{l.variant ? ` — ${l.variant}` : ""}{l.returnedQty > 0 && <span className="ml-2 text-xs text-muted-foreground">({l.returnedQty} {t("retourné(s)", "مُرجع")})</span>}</TableCell>
                    <TableCell>{l.qty}</TableCell>
                    <TableCell>{da(l.net)}</TableCell>
                    {sale.canReturn && (
                      <TableCell>
                        <Input className="w-20" inputMode="numeric" disabled={l.returnable <= 0} placeholder={`0–${l.returnable}`} value={qty[l.lineId] ?? ""}
                          onChange={(e) => setQty((q) => ({ ...q, [l.lineId]: e.target.value.replace(/\D/g, "") }))} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-sm">{t("Total", "المجموع")}: <strong>{da(sale.total)}</strong> · {sale.payments.map((p) => `${p.method === "CASH" ? t("espèces", "نقد") : p.method === "CREDIT" ? t("crédit", "دين") : t("carte", "بطاقة")} ${da(p.amount)}`).join(" · ")}</div>
            {error && <p className="text-sm text-red-600" data-testid="sale-error">{error}</p>}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {sale.canReturn && (
                <>
                  <select className="h-9 rounded-md border bg-background px-2 text-sm" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value as typeof refundMethod)} data-testid="refund-method">
                    <option value="CASH">{t("Rembourser en espèces", "استرجاع نقدًا")}</option>
                    <option value="CARD_EXTERNAL">{t("Rembourser par carte", "استرجاع بالبطاقة")}</option>
                    {sale.customer && <option value="CREDIT">{t("Sur le compte du client", "على حساب العميل")}</option>}
                  </select>
                  <Button disabled={busy || chosen.length === 0} onClick={() => run(async () => {
                    const r = await engine("sales:return", { id: crypto.randomUUID(), originalSaleId: sale.id, lines: chosen, refundMethod })
                    await load(sale.id)
                    // Return receipt (opens the drawer for a cash refund) when tickets print automatically.
                    const s = await engine("settings:sales")
                    if (s.receipt.autoPrint) await enginePrintReceipt(r.saleId).catch(() => {})
                  })}>
                    {t("Retourner", "إرجاع")}{refund > 0 ? ` (${da(refund)})` : ""}
                  </Button>
                </>
              )}
              <Button variant="outline" disabled={busy} onClick={() => run(async () => {
                const r = await enginePrintReceipt(sale.id)
                if (!r.printed) throw new Error(t("Aucune imprimante de tickets configurée (Paramètres).", "لا توجد طابعة وصولات (الإعدادات)."))
              })}>
                {t("Réimprimer", "إعادة الطباعة")}
              </Button>
              {sale.canVoid && (
                <Button variant="destructive" disabled={busy} onClick={() => {
                  const reason = window.prompt(t("Raison de l'annulation", "سبب الإلغاء"))
                  if (reason) void run(async () => { await engine("sales:void", { id: sale.id, reason }); await load(sale.id) })
                }}>
                  {t("Annuler la vente", "إلغاء البيع")}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
