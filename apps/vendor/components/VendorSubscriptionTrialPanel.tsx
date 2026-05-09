"use client"

import { useCallback, useMemo, useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/root/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/root/components/ui/card"
import { useToast } from "@/root/hooks/use-toast"
import { apiFetch } from "@/root/lib/api-fetch"
import { VENDOR_FREE_TRIAL_DAYS, PLAN_FEATURES, PLAN_DISPLAY_PRICING } from "@/root/lib/subscription-plans"

export type VendorSubscriptionLite = {
  id?: string
  plan: string
  status: string
  currentPeriodEnd?: string
  trialStart?: string | null
  trialEnd?: string | null
}

type Translate = (fr: string, ar: string) => string

type Variant = "banner" | "card"

interface VendorSubscriptionTrialPanelProps {
  variant: Variant
  translate: Translate
  subscription: VendorSubscriptionLite | null
  loading: boolean
  onUpdated: () => Promise<void>
}

export function VendorSubscriptionTrialPanel({
  variant,
  translate,
  subscription,
  loading,
  onUpdated,
}: VendorSubscriptionTrialPanelProps) {
  const { toast } = useToast()
  const [starting, setStarting] = useState(false)

  const trialDaysRemaining = useMemo(() => {
    if (subscription?.status !== "TRIAL" || !subscription.trialEnd) return null
    const end = new Date(subscription.trialEnd).getTime()
    if (!Number.isFinite(end)) return null
    return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)))
  }, [subscription?.status, subscription?.trialEnd])

  const canStartTrial = useMemo(() => {
    if (loading || !subscription) return true
    if (subscription.trialStart != null) return false
    if (subscription.status === "ACTIVE" && subscription.plan !== "STARTER") return false
    if (
      subscription.status === "TRIAL" &&
      subscription.trialEnd &&
      new Date(subscription.trialEnd).getTime() > Date.now()
    )
      return false
    return true
  }, [loading, subscription])

  const handleStartTrial = useCallback(async () => {
    setStarting(true)
    try {
      const res = await apiFetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTrial: true, plan: "PROFESSIONAL" }),
      })
      const data = await res.json()
      if (!data.success) {
        toast({
          title: translate("Essai gratuit", "تجربة مجانية"),
          description:
            typeof data.error === "string"
              ? data.error
              : translate("Impossible de démarrer l’essai.", "تعذر بدء التجربة."),
          variant: "destructive",
        })
        return
      }
      toast({
        title: translate("Essai démarré", "بدأت التجربة"),
        description: translate(
          `${VENDOR_FREE_TRIAL_DAYS} jours d’accès Professionnel.`,
          `${VENDOR_FREE_TRIAL_DAYS} يوماً من مزايا الاحترافي.`,
        ),
      })
      await onUpdated()
    } finally {
      setStarting(false)
    }
  }, [onUpdated, toast, translate])

  if (variant === "banner") {
    if (loading || subscription?.status !== "TRIAL" || trialDaysRemaining === null) return null
    return (
      <div
        className="mb-3 rounded-lg border border-teal-500/40 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 px-4 py-2.5 text-sm shadow-sm sm:py-3"
        role="status"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-foreground">
            {translate(
              `Essai Professionnel · ${trialDaysRemaining} jour(s) restant(s)`,
              `تجربة احترافي · متبقي ${trialDaysRemaining} يومًا`,
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => void onUpdated()}
          >
            {translate("Actualiser", "تحديث")}
          </Button>
        </div>
      </div>
    )
  }

  /* card variant — Settings ▸ Paiements */
  const planLabel =
    subscription?.plan === "STARTER"
      ? translate("Gratuit (Starter)", "مجاني (مبتدئ)")
      : subscription?.plan === "PROFESSIONAL"
        ? translate("Professionnel", "احترافي")
        : subscription?.plan === "BUSINESS"
          ? translate("Business", "أعمال")
          : subscription?.plan === "ENTERPRISE"
            ? translate("Entreprise (Vendor +)", "مؤسسات (+)")
            : translate("Non défini", "غير محدد")

  const dzForPlan =
    subscription?.plan && PLAN_DISPLAY_PRICING[subscription.plan]
      ? PLAN_DISPLAY_PRICING[subscription.plan].dzd + " DZD"
      : "—"

  const proFeat = PLAN_FEATURES.PROFESSIONAL

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-teal-600" aria-hidden />
          {translate("Abonnement & essai gratuit", "الاشتراك والتجربة المجانية")}
        </CardTitle>
        <CardDescription>
          {translate(
            `Essai ${VENDOR_FREE_TRIAL_DAYS} jours sur le niveau Professionnel, sans carte bancaire (commande COD possible ensuite).`,
            `تجرَب احترافي ${VENDOR_FREE_TRIAL_DAYS} يوماً دون بطاقة (البيع عند التسليم بعدها).`,
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{translate("Chargement…", "جاري التحميل…")}</p>
        ) : (
          <>
            {subscription?.status === "TRIAL" && trialDaysRemaining !== null && (
              <div className="rounded-md border border-teal-500/35 bg-teal-500/10 px-3 py-2 text-sm">
                {translate(
                  `Période d’essai : ${trialDaysRemaining} jour(s) restant(s) sur le niveau inclus dans votre contrat.`,
                  `فترة التجربة: متبقي ${trialDaysRemaining} يومًا على المستوى الحالي.`,
                )}
              </div>
            )}

            <div className="grid gap-1 text-sm">
              <span className="text-muted-foreground">{translate("Statut", "الحالة")}</span>
              <span className="font-medium">
                {subscription?.status ?? "—"} · {planLabel}{" "}
                {subscription?.plan && subscription.plan !== "STARTER" ? `(${dzForPlan})` : null}
              </span>
            </div>

            {canStartTrial && (
              <div className="space-y-2 rounded-lg border border-dashed p-3">
                <p className="text-sm text-muted-foreground">
                  {translate(
                    `Débloquez jusqu’à ${proFeat.maxProducts} produits, synchronisation cloud, WhatsApp (${VENDOR_FREE_TRIAL_DAYS} jours gratuits).`,
                    `فعّلوا حتى ${proFeat.maxProducts} منتجاً والمزامنة السحابية وواتساب (${VENDOR_FREE_TRIAL_DAYS} يوماً مجاناً).`,
                  )}
                </p>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                  disabled={starting}
                  onClick={() => void handleStartTrial()}
                >
                  {starting
                    ? translate("Démarrage…", "جاري البدء…")
                    : translate(`Démarrer l’essai ${VENDOR_FREE_TRIAL_DAYS} jours`, `ابدأ ${VENDOR_FREE_TRIAL_DAYS} يوم تجربة`)}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
