"use client"

import type { ReactNode } from "react"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { StoreDomainsSection } from "./security/StoreDomainsSection"
import { Globe } from "lucide-react"

interface VendorStorefrontWebPanelProps {
  translate: (fr: string, ar: string) => string
  /** Resolved vendor account whose domains we edit (admin selection or logged-in vendor). */
  vendorId: string | null
  /** When set, offers navigation to Settings → Security for vendor hostname setup */
  onConfigureVendorDomain?: () => void
}

export function VendorStorefrontWebPanel({
  translate,
  vendorId,
  onConfigureVendorDomain,
}: VendorStorefrontWebPanelProps) {
  const t = translate
  return (
    <motionDiv className="space-y-6 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:px-5 2xl:px-6">
      <header className="space-y-1">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Globe className="size-7 text-teal-600" aria-hidden />
          {t("Vitrine en ligne", "واجهة الويب العامة")}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t(
            "Domaines par magasin. Le sous-domaine vendeur et le domaine personnalisé se configurent dans Paramètres → Sécurité.",
            "نطاقات كل متجر. النطاق الفرعي للتاجر والنطاق المخصّص يُضبطان من الإعدادات → الأمان."
          )}
        </p>
        {onConfigureVendorDomain ? (
          <Button type="button" variant="outline" size="sm" onClick={onConfigureVendorDomain}>
            {t("Configurer le domaine vendeur", "إعداد نطاق التاجر")}
          </Button>
        ) : null}
      </header>

      {!vendorId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("Compte vendeur", "حساب التاجر")}
            </CardTitle>
            <CardDescription>
              {t(
                "Sélectionnez un vendeur (mode administrateur) pour gérer les domaines des magasins.",
                "اختر تاجراً (وضع المشرف) لإدارة نطاقات المتاجر."
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <StoreDomainsSection vendorId={vendorId} translate={translate} />
    </motionDiv>
  )
}

function motionDiv({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}
