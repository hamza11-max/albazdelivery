"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { ShoppingBag, CheckCircle, Clock, CheckCircle2, AlertCircle, MessageCircle, X } from "lucide-react"
import type { Order } from "@/root/lib/types"

const ACTIVE_ORDER_STATUSES = new Set([
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "IN_DELIVERY",
])
const HISTORY_ORDER_STATUSES = new Set(["DELIVERED", "CANCELLED"])

export type OrdersSegment = "active" | "history" | "all"

interface OrdersTabProps {
  orders: Order[]
  loadingState: { orders: boolean }
  translate: (fr: string, ar: string) => string
  handleUpdateOrderStatus: (order: Order, status: string) => Promise<void>
  prepTimeMinutes: number
  filterCustomerId?: string | null
  highlightOrderId?: string | null
  onClearCustomerFilter?: () => void
}

export function OrdersTab({
  orders,
  loadingState,
  translate,
  handleUpdateOrderStatus,
  prepTimeMinutes,
  filterCustomerId = null,
  highlightOrderId = null,
  onClearCustomerFilter,
}: OrdersTabProps) {
  const [segment, setSegment] = useState<OrdersSegment>("active")
  const highlightSegmentAppliedRef = useRef<string | null>(null)

  const filteredOrders = useMemo(() => {
    let list = orders
    if (filterCustomerId) {
      list = list.filter(
        (o) =>
          o.customerId === filterCustomerId ||
          (o as { customer?: { id?: string } }).customer?.id === filterCustomerId,
      )
    }
    if (segment === "active") {
      list = list.filter((o) => ACTIVE_ORDER_STATUSES.has(String(o.status)))
    } else if (segment === "history") {
      list = list.filter((o) => HISTORY_ORDER_STATUSES.has(String(o.status)))
    }
    return list
  }, [orders, filterCustomerId, segment])

  useEffect(() => {
    if (!highlightOrderId) {
      highlightSegmentAppliedRef.current = null
      return
    }
    if (loadingState.orders) return
    if (highlightSegmentAppliedRef.current === highlightOrderId) return
    const highlighted = orders.find((o) => o.id === highlightOrderId)
    if (!highlighted) return
    highlightSegmentAppliedRef.current = highlightOrderId
    const st = String(highlighted.status)
    if (HISTORY_ORDER_STATUSES.has(st)) setSegment("history")
    else if (ACTIVE_ORDER_STATUSES.has(st)) setSegment("active")
    else setSegment("all")
  }, [highlightOrderId, loadingState.orders, orders])

  useEffect(() => {
    if (!highlightOrderId || loadingState.orders) return
    const t = window.setTimeout(() => {
      const el = document.getElementById(`vendor-order-${highlightOrderId}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-teal-500", "rounded-xl")
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-teal-500", "rounded-xl")
        }, 4500)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [highlightOrderId, loadingState.orders, filteredOrders.length])

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    ACCEPTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    PREPARING: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    READY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    ASSIGNED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    IN_DELIVERY: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  const statusLabels: Record<string, { fr: string; ar: string }> = {
    PENDING: { fr: "En attente", ar: "قيد الانتظار" },
    ACCEPTED: { fr: "Acceptée", ar: "مقبولة" },
    PREPARING: { fr: "En préparation", ar: "قيد التحضير" },
    READY: { fr: "Prête", ar: "جاهزة" },
    ASSIGNED: { fr: "Assignée", ar: "معينة" },
    IN_DELIVERY: { fr: "En livraison", ar: "قيد التوصيل" },
    DELIVERED: { fr: "Livrée", ar: "تم التوصيل" },
    CANCELLED: { fr: "Annulée", ar: "ملغاة" },
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {translate("Gestion des Commandes", "إدارة الطلبات")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {translate(
              "ETA basé sur le temps de préparation (paramétrable dans Paramètres).",
              "الوقت المتوقع يعتمد على وقت التحضير (يمكن تعديله في الإعدادات).",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={segment === "active" ? "default" : "outline"}
            className={segment === "active" ? "bg-albaz-green-gradient hover:opacity-90 text-white" : ""}
            onClick={() => setSegment("active")}
          >
            {translate("En cours", "الجارية")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={segment === "history" ? "default" : "outline"}
            onClick={() => setSegment("history")}
          >
            {translate("Historique", "السجل")}
          </Button>
          <Button type="button" size="sm" variant={segment === "all" ? "default" : "outline"} onClick={() => setSegment("all")}>
            {translate("Toutes", "الكل")}
          </Button>
        </div>
      </div>

      {filterCustomerId && onClearCustomerFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span>{translate("Filtre : commandes de ce client uniquement", "تصفية: طلبات هذا العميل فقط")}</span>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={onClearCustomerFilter}>
            <X className="h-3.5 w-3.5" />
            {translate("Effacer", "إلغاء التصفية")}
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          {loadingState.orders ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                {translate("Aucune commande reçue", "لم يتم استلام أي طلبات")}
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                {translate("Aucune commande dans cette vue", "لا توجد طلبات في هذا العرض")}
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => setSegment("all")}>
                {translate("Voir toutes les commandes", "عرض كل الطلبات")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const status = order.status || "PENDING"
                const statusLabel = statusLabels[String(status)] || { fr: String(status), ar: String(status) }
                const createdAt = new Date(order.createdAt || Date.now())
                const eta = new Date(createdAt.getTime() + Math.max(prepTimeMinutes, 0) * 60000)

                return (
                  <Card
                    key={order.id}
                    id={`vendor-order-${order.id}`}
                    className="border-l-4 border-l-albaz-green-500 scroll-mt-24 transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold">
                              {translate("Commande", "طلب")} #{order.id.slice(0, 8)}
                            </h3>
                            {(order as { orderSource?: string }).orderSource === "WHATSAPP" && (
                              <Badge variant="outline" className="gap-1 border-green-600/50 text-green-700 dark:text-green-400">
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp
                              </Badge>
                            )}
                            <Badge className={statusColors[String(status)]}>{translate(statusLabel.fr, statusLabel.ar)}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              <strong>{translate("Client", "العميل")}:</strong>{" "}
                              {(order as { customer?: { name?: string } }).customer?.name || "N/A"}
                            </p>
                            <p>
                              <strong>{translate("Téléphone", "الهاتف")}:</strong>{" "}
                              {(order as { customerPhone?: string; customer?: { phone?: string } }).customerPhone ||
                                (order as { customer?: { phone?: string } }).customer?.phone ||
                                "N/A"}
                            </p>
                            <p>
                              <strong>{translate("Adresse", "العنوان")}:</strong>{" "}
                              {(order as { deliveryAddress?: string }).deliveryAddress || "N/A"}
                            </p>
                            <p>
                              <strong>{translate("Date", "التاريخ")}:</strong>{" "}
                              {new Date(order.createdAt || Date.now()).toLocaleString("fr-FR")}
                            </p>
                            <p>
                              <strong>{translate("ETA préparation", "الوقت المقدر للتحضير")}:</strong>{" "}
                              {isNaN(eta.getTime()) ? translate("N/A", "غير متاح") : eta.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <div className="mt-2">
                              <strong>{translate("Articles", "العناصر")}:</strong>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {(order.items || []).map((item: { quantity: number; price: number; product?: { name?: string }; productName?: string }, idx: number) => (
                                  <li key={idx}>
                                    {item.quantity}x {item.product?.name || item.productName || "N/A"} - {(item.price * item.quantity).toFixed(2)}{" "}
                                    {translate("DZD", "دج")}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <p className="mt-2 font-bold text-lg">
                              {translate("Total", "المجموع")}: {order.total?.toFixed(2) || "0.00"} {translate("DZD", "دج")}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:w-auto w-full">
                          {status === "PENDING" && (
                            <Button className="bg-albaz-green-gradient hover:opacity-90 text-white" onClick={() => handleUpdateOrderStatus(order, "ACCEPTED")}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {translate("Confirmer", "تأكيد")}
                            </Button>
                          )}
                          {status === "ACCEPTED" && (
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleUpdateOrderStatus(order, "PREPARING")}>
                              <Clock className="w-4 h-4 mr-2" />
                              {translate("Commencer la préparation", "بدء التحضير")}
                            </Button>
                          )}
                          {status === "PREPARING" && (
                            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleUpdateOrderStatus(order, "READY")}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              {translate("Marquer comme prête", "تمييز كجاهزة")}
                            </Button>
                          )}
                          {(status === "PENDING" || status === "ACCEPTED" || status === "PREPARING") && (
                            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleUpdateOrderStatus(order, "CANCELLED")}>
                              <AlertCircle className="w-4 h-4 mr-2" />
                              {translate("Annuler", "إلغاء")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
