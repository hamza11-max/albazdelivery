"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { TrendingUp, TrendingDown, Package, ShoppingBag, Sparkles } from "lucide-react"
import type { SalesForecast, InventoryRecommendation, BundleRecommendation } from "../../app/vendor/types"

interface AITabProps {
  salesForecast: SalesForecast | null
  inventoryRecommendations: InventoryRecommendation[]
  productBundles: BundleRecommendation[]
  translate: (fr: string, ar: string) => string
}

export function AITab({
  salesForecast,
  inventoryRecommendations,
  productBundles,
  translate,
}: AITabProps) {
  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-purple-500" />
        <h2 className="text-2xl font-bold">{translate("Insights Alimentés par l'IA", "رؤى مدعومة بالذكاء الاصطناعي")}</h2>
      </div>

      {/* Sales Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {translate("Prévisions des Ventes", "توقعات المبيعات")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesForecast ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{translate("Semaine Prochaine", "الأسبوع القادم")}</p>
                  <p className="text-2xl font-bold">{salesForecast.week?.toFixed(2)} {translate("DZD", "دج")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{translate("Mois Prochain", "الشهر القادم")}</p>
                  <p className="text-2xl font-bold">{salesForecast.month?.toFixed(2)} {translate("DZD", "دج")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {salesForecast.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : salesForecast.trend === "down" ? (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {translate("Tendance", "الاتجاه")}:{" "}
                  {salesForecast.trend === "up" 
                    ? translate("Hausse", "ارتفاع") 
                    : salesForecast.trend === "down" 
                    ? translate("Baisse", "انخفاض") 
                    : translate("Stable", "مستقر")}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {translate("Données insuffisantes pour les prévisions", "بيانات غير كافية للتنبؤات")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Inventory Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {translate("Recommandations de Stock", "توصيات المخزون")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryRecommendations.length > 0 ? (
            <div className="space-y-3">
              {inventoryRecommendations.map((rec) => (
                <div key={rec.productId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{rec.productName}</p>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                  <Badge>{translate("Commander", "طلب")} {rec.recommendedQuantity}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              {translate("Aucune recommandation pour le moment", "لا توجد توصيات في الوقت الحالي")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Product Bundles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {translate("Suggestions de Bundles", "اقتراحات الباقات")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productBundles.length > 0 ? (
            <div className="space-y-3">
              {productBundles.map((bundle, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-2">{translate("Bundle", "باقة")} #{index + 1}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {translate("Acheté ensemble", "تم شراؤه معاً")} {bundle.frequency} {translate("fois", "مرة")}
                  </p>
                  <Badge variant="secondary">
                    {translate("Remise suggérée", "خصم مقترح")}: {bundle.suggestedDiscount}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              {translate("Aucune suggestion de bundle pour le moment", "لا توجد اقتراحات باقات في الوقت الحالي")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

