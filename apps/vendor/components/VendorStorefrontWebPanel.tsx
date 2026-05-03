"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/root/components/ui/card"
import { VendorDomainsCard } from "./security/VendorDomainsCard"
import { StoreDomainsSection } from "./security/StoreDomainsSection"
import { Globe } from "lucide-react"

interface VendorStorefrontWebPanelProps {
  translate: (fr: string, ar: string) => string
  /** Resolved vendor account whose domains we edit (admin selection or logged-in vendor). */
  vendorId: string | null
}

export function VendorStorefrontWebPanel({
  translate,
  vendorId,
}: VendorStorefrontWebPanelProps) {
  const t = translate
  return (
    <div className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
      <header className="space-y-1">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Globe className="size-7 text-teal-600" aria-hidden />
          {t("Vitrine en ligne", "واجهة الويب العامة")}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t(
            "Choisissez le sous-domaine sur la plateforme et optionnellement un domaine personnalisé (DNS). Les clients commandent sur cette adresse.",
            "اختَر النطاق الفرعي على المنصة واختيارياً نطاقاً مخصّصاً (DNS). يطلب العملاء من هذا العنوان."
          )}
        </p>
      </header>

      {vendorId ? (
        <VendorDomainsCard translate={translate} managedVendorId={vendorId} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("Compte vendeur", "حساب التاجر")}
            </CardTitle>
            <CardDescription>
              {t(
                "Sélectionnez un vendeur (mode administrateur) pour configurer ses domaines publics.",
                "اختر تاجراً (وضع المشرف) لإعداد نطاقاته العامة."
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <StoreDomainsSection vendorId={vendorId} translate={translate} />
    </div>
  )
}
