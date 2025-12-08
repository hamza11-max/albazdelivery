"use client"

import { Card, CardContent, CardHeader, CardTitle, Badge } from "@albaz/ui"
import { OrderStatus } from "@/root/lib/constants"
import { ShoppingBag, TrendingUp, Clock, CheckCircle2, Users, Truck, Store, Package, AlertTriangle, Shield } from "lucide-react"
import type { Order, User as UserType } from "@/root/lib/types"

interface DashboardViewProps {
  orders: Order[]
  customers: UserType[]
  drivers: UserType[]
  vendors: UserType[]
}

export function DashboardView({ orders, customers, drivers, vendors }: DashboardViewProps) {
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING).length 
  const completedOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED).length
  const totalRevenue = orders.filter((o) => o.status === OrderStatus.DELIVERED).reduce((sum, o) => sum + o.total, 0)
  const now = Date.now()
  const staleThresholdMs = 30 * 60 * 1000 // 30 minutes
  const staleOrders = orders.filter(
    (o) =>
      (o.status === OrderStatus.PENDING || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING) &&
      now - new Date(o.createdAt).getTime() > staleThresholdMs,
  )
  const highValueCash = orders.filter((o) => (o as any)?.paymentMethod === "cash" && o.total > 10000)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="albaz-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--albaz-text-soft)] mb-1">Total Commandes</p>
                <p className="text-3xl font-bold text-[var(--albaz-text)]">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--albaz-olive)] flex items-center justify-center text-white">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="albaz-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--albaz-text-soft)] mb-1">Revenu Total</p>
                <p className="text-3xl font-bold text-[var(--albaz-text)]">{totalRevenue}</p>
                <p className="text-xs text-[var(--albaz-text-soft)]">DZD</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--albaz-olive)] flex items-center justify-center text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="albaz-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--albaz-text-soft)] mb-1">En Attente</p>
                <p className="text-3xl font-bold text-[var(--albaz-text)]">{pendingOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--albaz-orange)] flex items-center justify-center text-white">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="albaz-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--albaz-text-soft)] mb-1">Complétées</p>
                <p className="text-3xl font-bold text-[var(--albaz-text)]">{completedOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--albaz-olive)] flex items-center justify-center text-white">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="albaz-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{customers.length}</p>
            <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
          </CardContent>
        </Card>

        <Card className="albaz-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Livreurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{drivers.length}</p>
            <p className="text-sm text-muted-foreground">Personnel de livraison</p>
          </CardContent>
        </Card>

        <Card className="albaz-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{vendors.length}</p>
            <p className="text-sm text-muted-foreground">Magasins partenaires</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="albaz-card border-amber-300/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Commandes en risque (SLA)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-amber-700">{staleOrders.length}</p>
            <p className="text-sm text-muted-foreground">
              Plus de 30 min en attente / préparation
            </p>
            <div className="space-y-2">
              {staleOrders.slice(0, 3).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                  <span className="font-mono text-sm">#{o.id}</span>
                  <Badge variant="outline">{o.status}</Badge>
                </div>
              ))}
              {staleOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune alerte SLA</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="albaz-card border-emerald-300/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
              <Shield className="w-5 h-5" />
              Surveillance paiement (cash)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-emerald-700">{highValueCash.length}</p>
            <p className="text-sm text-muted-foreground">
              Montants &gt; 10k DZD en espèces à vérifier
            </p>
            <div className="space-y-2">
              {highValueCash.slice(0, 3).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-emerald-900">
                  <span className="font-mono text-sm">#{o.id}</span>
                  <span className="text-sm font-semibold">{o.total} DZD</span>
                </div>
              ))}
              {highValueCash.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune alerte cash</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commandes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">#{order.id}</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString("fr-DZ")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{order.total} DZD</p>
                  <Badge
                    variant={
                      order.status === OrderStatus.DELIVERED
                        ? "default"
                        : order.status === OrderStatus.CANCELLED
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

