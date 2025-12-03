"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrderStatus } from "@/root/lib/constants"
import { ShoppingBag, TrendingUp, Clock, CheckCircle2, Users, Truck, Store, Package } from "lucide-react"
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Commandes</p>
                <p className="text-3xl font-bold text-blue-900">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Revenu Total</p>
                <p className="text-3xl font-bold text-green-900">{totalRevenue}</p>
                <p className="text-xs text-green-700">DZD</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 mb-1">En Attente</p>
                <p className="text-3xl font-bold text-orange-900">{pendingOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 mb-1">Complétées</p>
                <p className="text-3xl font-bold text-purple-900">{completedOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
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

        <Card>
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

        <Card>
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

