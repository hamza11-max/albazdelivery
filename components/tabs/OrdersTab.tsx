"use client"

import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { ShoppingBag, CheckCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import type { Order } from "@/root/lib/types"

interface OrdersTabProps {
  orders: Order[]
  loadingState: { orders: boolean }
  translate: (fr: string, ar: string) => string
  handleUpdateOrderStatus: (orderId: string, status: string) => Promise<void>
}

export function OrdersTab({
  orders,
  loadingState,
  translate,
  handleUpdateOrderStatus,
}: OrdersTabProps) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {translate("Gestion des Commandes", "إدارة الطلبات")}
        </h2>
      </div>

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
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = order.status || "PENDING"
                const statusLabel = statusLabels[status] || { fr: status, ar: status }

                return (
                  <Card key={order.id} className="border-l-4 border-l-albaz-green-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {translate("Commande", "طلب")} #{order.id.slice(0, 8)}
                            </h3>
                            <Badge className={statusColors[status]}>
                              {translate(statusLabel.fr, statusLabel.ar)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              <strong>{translate("Client", "العميل")}:</strong>{" "}
                              {(order as any).customer?.name || "N/A"}
                            </p>
                            <p>
                              <strong>{translate("Téléphone", "الهاتف")}:</strong>{" "}
                              {(order as any).customerPhone || (order as any).customer?.phone || "N/A"}
                            </p>
                            <p>
                              <strong>{translate("Adresse", "العنوان")}:</strong>{" "}
                              {(order as any).deliveryAddress || "N/A"}
                            </p>
                            <p>
                              <strong>{translate("Date", "التاريخ")}:</strong>{" "}
                              {new Date(order.createdAt || Date.now()).toLocaleString("fr-FR")}
                            </p>
                            <div className="mt-2">
                              <strong>{translate("Articles", "العناصر")}:</strong>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {(order.items || []).map((item: any, idx: number) => (
                                  <li key={idx}>
                                    {item.quantity}x {item.product?.name || item.productName || "N/A"} -{" "}
                                    {(item.price * item.quantity).toFixed(2)} {translate("DZD", "دج")}
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
                            <Button
                              className="bg-albaz-green-gradient hover:opacity-90 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "ACCEPTED")}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {translate("Confirmer", "تأكيد")}
                            </Button>
                          )}
                          {status === "ACCEPTED" && (
                            <Button
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "PREPARING")}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              {translate("Commencer la préparation", "بدء التحضير")}
                            </Button>
                          )}
                          {status === "PREPARING" && (
                            <Button
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "READY")}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              {translate("Marquer comme prête", "تمييز كجاهزة")}
                            </Button>
                          )}
                          {(status === "PENDING" || status === "ACCEPTED" || status === "PREPARING") && (
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                            >
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

