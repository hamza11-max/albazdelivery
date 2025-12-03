"use client"

import { TrendingUp, TrendingDown, Package, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@albaz/ui"
import type { SalesForecast, InventoryRecommendation, BundleRecommendation } from "../../app/vendor/types"

interface AIInsightsTabProps {
  salesForecast: SalesForecast | null
  inventoryRecommendations: InventoryRecommendation[]
  productBundles: BundleRecommendation[]
  translate: (fr: string, ar: string) => string
}

export function AIInsightsTab({
  salesForecast,
  inventoryRecommendations,
  productBundles,
  translate,
}: AIInsightsTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{translate("Insights Alimentés par l'IA", "رؤى مدعومة بالذكاء الاصطناعي")}</h2>

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
                  <p className="text-2xl font-bold">{salesForecast.week?.toFixed(2)} DZD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{translate("Mois Prochain", "الشهر القادم")}</p>
                  <p className="text-2xl font-bold">{salesForecast.month?.toFixed(2)} DZD</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {salesForecast.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : salesForecast.trend === "down" ? (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {translate("Tendance:", "الاتجاه:")}{" "}
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
            {translate("Recommandations de Réapprovisionnement", "توصيات إعادة التوريد")}
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
                  <Badge>{translate("Commander", "اطلب")} {rec.recommendedQuantity}</Badge>
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
            {translate("Suggestions de Bundles", "اقتراحات الحزم")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productBundles.length > 0 ? (
            <div className="space-y-3">
              {productBundles.map((bundle, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Bundle #{index + 1}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {translate("Acheté ensemble", "تم شراؤه معاً")} {bundle.frequency}{" "}
                    {translate("fois", "مرة")}
                  </p>
                  <Badge variant="secondary">
                    {translate("Remise suggérée:", "الخصم المقترح:")} {bundle.suggestedDiscount}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              {translate("Aucune suggestion de bundle pour le moment", "لا توجد اقتراحات حزم في الوقت الحالي")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

