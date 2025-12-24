"use client"

import { useState } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { DollarSign, TrendingUp, BarChart3, AlertTriangle, ShoppingCart, Plus, Package, History } from "lucide-react"
import type { InventoryProduct } from "@/root/lib/types"
import type { TopProductData } from "../../app/vendor/types"
interface DashboardTabProps {
  todaySales: number
  weekSales: number
  monthSales: number
  topProducts: TopProductData[]
  lowStockProducts: InventoryProduct[]
  translate: (fr: string, ar: string) => string
  setActiveTab: (tab: string) => void
  setShowProductDialog: (show: boolean) => void
  currentStaffId?: string
}

export function DashboardTab({
  todaySales,
  weekSales,
  monthSales,
  topProducts,
  lowStockProducts,
  translate,
  setActiveTab,
  setShowProductDialog,
  currentStaffId,
}: DashboardTabProps) {

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      {/* Sales Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {translate("Ventes d'aujourd'hui", "مبيعات اليوم")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {todaySales.toFixed(2)} {translate("DZD", "دج")}
              </p>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {translate("Ventes cette semaine", "مبيعات هذا الأسبوع")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {weekSales.toFixed(2)} {translate("DZD", "دج")}
              </p>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {translate("Ventes ce mois", "مبيعات هذا الشهر")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {monthSales.toFixed(2)} {translate("DZD", "دج")}
              </p>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{translate("Produits les plus vendus", "المنتجات الأكثر مبيعاً")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.totalQuantity} {translate("vendus", "تم بيعها")}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {translate("Aucune vente enregistrée", "لا توجد مبيعات مسجلة")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {translate("Alertes stock faible", "تنبيهات انخفاض المخزون")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {translate("Référence", "المرجع")}: {product.sku}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {product.stock} {translate("restants", "متبقي")}
                  </Badge>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {translate("Tous les stocks sont suffisants", "جميع المخزونات كافية")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{translate("Actions rapides", "إجراءات سريعة")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={() => setActiveTab("pos")} className="h-20 flex-col gap-2">
              <ShoppingCart className="w-6 h-6" />
              {translate("Nouvelle vente", "عملية بيع جديدة")}
            </Button>
            <Button onClick={() => setShowProductDialog(true)} variant="outline" className="h-20 flex-col gap-2">
              <Plus className="w-6 h-6" />
              {translate("Ajouter un produit", "إضافة منتج")}
            </Button>
            <Button onClick={() => setActiveTab("inventory")} variant="outline" className="h-20 flex-col gap-2">
              <Package className="w-6 h-6" />
              {translate("Voir l'inventaire", "عرض المخزون")}
            </Button>
            <Button onClick={() => setActiveTab("sales")} variant="outline" className="h-20 flex-col gap-2">
              <History className="w-6 h-6" />
              {translate("Historique", "السجل")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
