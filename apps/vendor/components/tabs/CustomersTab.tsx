"use client"

import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Plus, Users, ShoppingBag, MessageCircle } from "lucide-react"
import type { Customer } from "@/root/lib/types"
import { useEffect, useState } from "react"
import type { LedgerEntry } from "../../electron/shared/ipc"
import { dinars, engine, toCustomer, type EngineCustomer } from "../../lib/engine"

const LEDGER_LABEL: Record<LedgerEntry["type"], [string, string]> = {
  CREDIT_SALE: ["Achat à crédit", "شراء بالدين"],
  PAYMENT: ["Règlement", "تسديد"],
  CREDIT_RETURN: ["Retour / annulation", "إرجاع / إلغاء"],
  ADJUST: ["Correction", "تصحيح"],
}

/** Desktop app: what the customer owes, taking a payment, and their credit book (carnet). */
function CreditBook({ customer, translate }: { customer: EngineCustomer; translate: (fr: string, ar: string) => string }) {
  const [c, setC] = useState(customer)
  const [ledger, setLedger] = useState<LedgerEntry[] | null>(null)
  const [error, setError] = useState("")
  // The list may be older than the last sale: read the current balance when shown.
  useEffect(() => {
    engine("customers:get", { id: customer.id }).then((r) => setC(toCustomer(r))).catch(() => {})
  }, [customer.id])
  const pay = async () => {
    const raw = window.prompt(translate(`Montant reçu (doit ${c.balance} DA)`, `المبلغ المستلم (عليه ${c.balance} د.ج)`), String(c.balance))
    if (!raw) return
    try {
      setError("")
      setC(toCustomer(await engine("customers:pay", { id: crypto.randomUUID(), customerId: c.id, amount: dinars(raw), method: "CASH", note: "" })))
      if (ledger) setLedger(await engine("customers:ledger", { id: c.id }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }
  return (
    <div className="mt-3 space-y-2" data-testid="credit-book">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{translate("Crédit", "الدين")}</span>
        <span className={c.balance > 0 ? "font-semibold text-red-600" : "text-muted-foreground"} data-testid="customer-balance">
          {c.balance} DA{c.creditLimit !== null ? ` / ${c.creditLimit}` : ""}
        </span>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" className="flex-1" disabled={c.balance <= 0} onClick={pay}>
          {translate("Encaisser", "تحصيل")}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="flex-1" onClick={async () => setLedger(ledger ? null : await engine("customers:ledger", { id: c.id }))}>
          {translate("Carnet", "الدفتر")}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {ledger && (
        <ul className="space-y-1 text-xs">
          {ledger.length === 0 && <li className="text-muted-foreground">{translate("Aucune opération", "لا توجد عمليات")}</li>}
          {ledger.map((l) => (
            <li key={l.id} className="flex justify-between gap-2">
              <span>{new Date(l.createdAt).toLocaleDateString("fr-FR")} · {translate(...LEDGER_LABEL[l.type])}{l.saleNumber ? ` ${l.saleNumber}` : ""}{l.note ? ` · ${l.note}` : ""}</span>
              <span className={l.amount > 0 ? "text-red-600" : "text-green-700"}>{l.amount > 0 ? "+" : ""}{l.amount}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface CustomersTabProps {
  customers: Customer[]
  translate: (fr: string, ar: string) => string
  setShowCustomerDialog: (show: boolean) => void
  onViewCustomerOrders?: (customerId: string) => void
}

export function CustomersTab({
  customers,
  translate,
  setShowCustomerDialog,
  onViewCustomerOrders,
}: CustomersTabProps) {
  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{translate("Gestion des Clients", "إدارة العملاء")}</h2>
        <Button onClick={() => setShowCustomerDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {translate("Ajouter un Client", "إضافة عميل")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => {
          const posTotal = customer.totalPurchases ?? 0
          const deliveryTotal = customer.deliveryTotal ?? 0
          const combined = posTotal + deliveryTotal
          const waCount = customer.whatsappOrderCount ?? 0
          const deliveryCount = customer.deliveryOrderCount ?? 0
          return (
            <Card key={customer.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="secondary">{combined.toFixed(2)} {translate("DZD", "دج")}</Badge>
                    {waCount > 0 && (
                      <Badge variant="outline" className="gap-1 border-green-600/50 text-green-700 dark:text-green-400 block w-fit ml-auto">
                        <MessageCircle className="h-3 w-3" />
                        {waCount} WhatsApp
                      </Badge>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{customer.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{customer.phone}</p>
                  {customer.email && <p>{customer.email}</p>}
                  {deliveryCount > 0 && (
                    <p className="text-xs">
                      {translate("Commandes livraison", "طلبات التوصيل")}: {deliveryCount}
                      {posTotal > 0 && (
                        <>
                          {" · "}
                          {translate("Caisse (POS)", "نقطة البيع")}: {posTotal.toFixed(2)} {translate("DZD", "دج")}
                        </>
                      )}
                    </p>
                  )}
                  {customer.lastPurchaseDate && (
                    <p className="text-xs">
                      {translate("Dernière activité", "آخر نشاط")}: {new Date(customer.lastPurchaseDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
                {"balance" in customer && <CreditBook customer={customer as EngineCustomer} translate={translate} />}
                {onViewCustomerOrders && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full gap-2"
                    onClick={() => onViewCustomerOrders(customer.id)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {translate("Voir les commandes", "عرض الطلبات")}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {customers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              {translate("Aucun client enregistré", "لا يوجد عملاء مسجلون")}
            </p>
            <Button onClick={() => setShowCustomerDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {translate("Ajouter votre premier client", "أضف أول عميل لك")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
