"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/root/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/root/components/ui/card"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import {
  CheckCircle2,
  Copy,
  Globe,
  Link as LinkIcon,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

interface VendorDomainsCardProps {
  translate?: (fr: string, ar: string) => string
  /**
   * Apex domain used to construct the preview link for subdomains. Defaults
   * to `NEXT_PUBLIC_BASE_DOMAIN` or `albazdelivery.com`.
   */
  baseDomain?: string
}

interface DomainsResponse {
  vendorId: string
  domains: {
    subdomain: string | null
    customDomain: string | null
    status: "PENDING" | "VERIFIED" | "FAILED"
    verifiedAt: string | null
  }
  subscription: {
    currentPlan: string
    currentStatus: string
    allowDomainWrites: boolean
    allowVendorCustomDomain: boolean
    maxStoreCustomDomains: number
    usedStoreCustomDomains: number
    remainingStoreDomains: number
  }
  verification?: {
    token: string
    records: Array<{
      type: string
      host: string
      value: string
      purpose: string
    }>
  }
}

const defaultT = (fr: string, _ar: string) => fr

export function VendorDomainsCard({
  translate,
  baseDomain,
}: VendorDomainsCardProps) {
  const t = translate || defaultT
  const apex = useMemo(
    () =>
      (baseDomain ||
        process.env.NEXT_PUBLIC_BASE_DOMAIN ||
        "albazdelivery.com") as string,
    [baseDomain]
  )

  const [data, setData] = useState<DomainsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [subdomainInput, setSubdomainInput] = useState("")
  const [customDomainInput, setCustomDomainInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/vendor/domains", {
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(
          err?.error?.message || t("Échec du chargement", "فشل التحميل")
        )
      }
      const json = await res.json()
      const payload = (json?.data || json) as DomainsResponse
      setData(payload)
      setSubdomainInput(payload.domains.subdomain || "")
      setCustomDomainInput(payload.domains.customDomain || "")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch("/api/vendor/domains", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorSubdomain: subdomainInput.trim() || null,
          vendorCustomDomain: customDomainInput.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(
          err?.error?.message ||
            t("Impossible d'enregistrer", "تعذّر الحفظ")
        )
      }
      const json = await res.json()
      const payload = (json?.data || json) as DomainsResponse
      setData(payload)
      setMessage(t("Modifications enregistrées", "تم حفظ التغييرات"))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify() {
    setVerifying(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch("/api/vendor/domains/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(
          err?.error?.message || t("Échec de la vérification", "فشل التحقق")
        )
      }
      const json = await res.json()
      const result = json?.data || json
      if (result?.verified) {
        setMessage(t("Domaine vérifié ✅", "تم التحقق من النطاق ✅"))
      } else {
        setError(
          result?.reason ||
            t(
              "DNS non propagé — réessayez dans quelques minutes.",
              "لم تنتشر سجلات DNS بعد — أعد المحاولة بعد بضع دقائق."
            )
        )
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setVerifying(false)
    }
  }

  const status = data?.domains.status
  const normalizedSubdomain = subdomainInput.trim().toLowerCase()
  const normalizedCustomDomain = customDomainInput.trim().toLowerCase()
  const subdomainUrl = normalizedSubdomain
    ? `https://${normalizedSubdomain}.${apex}`
    : null
  const customDomainUrl = normalizedCustomDomain
    ? `https://${normalizedCustomDomain}`
    : null
  const savedSubdomain = data?.domains.subdomain || ""
  const savedCustomDomain = data?.domains.customDomain || ""
  const hasChanges =
    normalizedSubdomain !== savedSubdomain ||
    normalizedCustomDomain !== savedCustomDomain
  const canEdit = Boolean(data?.subscription?.allowDomainWrites)
  const canEditCustom = Boolean(
    data?.subscription?.allowDomainWrites &&
      data?.subscription?.allowVendorCustomDomain
  )
  const canSave =
    canEdit && hasChanges && Boolean(normalizedSubdomain || normalizedCustomDomain)

  const copyToClipboard = useCallback(async (value: string) => {
    try {
      await navigator.clipboard?.writeText(value)
      setCopiedValue(value)
      window.setTimeout(() => setCopiedValue(null), 1500)
    } catch {
      // Clipboard is optional in embedded Electron/webview contexts.
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-5" />
          {t("Vitrine publique (sous-domaine)", "الواجهة العامة (نطاق فرعي)")}
        </CardTitle>
        <CardDescription>
          {t(
            "Activez une page de commande publique pour vos clients — votre lien « take.app » à vous.",
            "فعّل صفحة طلب عامة لعملائك — رابط «take.app» الخاص بك."
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("Chargement…", "جاري التحميل…")}
          </div>
        ) : (
          <>
            <StatusBanner status={status} t={t} />

            <div className="grid gap-3 md:grid-cols-2">
              <DomainPreviewTile
                title={t("Lien sous-domaine", "رابط النطاق الفرعي")}
                description={t(
                  "Le lien simple à partager avec vos clients.",
                  "الرابط السهل لمشاركته مع العملاء."
                )}
                href={subdomainUrl}
                emptyLabel={t("Choisissez un sous-domaine", "اختر نطاقاً فرعياً")}
                copyLabel={
                  copiedValue === subdomainUrl
                    ? t("Copié", "تم النسخ")
                    : t("Copier", "نسخ")
                }
                openLabel={t("Ouvrir", "فتح")}
                onCopy={copyToClipboard}
              />
              <DomainPreviewTile
                title={t("Domaine personnalisé", "النطاق المخصّص")}
                description={t(
                  "Connectez votre propre marque après DNS.",
                  "اربط علامتك التجارية بعد إعداد DNS."
                )}
                href={customDomainUrl}
                emptyLabel={t("Aucun domaine personnalisé", "لا يوجد نطاق مخصّص")}
                copyLabel={
                  copiedValue === customDomainUrl
                    ? t("Copié", "تم النسخ")
                    : t("Copier", "نسخ")
                }
                openLabel={t("Ouvrir", "فتح")}
                onCopy={copyToClipboard}
              />
            </div>

            {data?.subscription ? (
              <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground sm:grid-cols-3">
                <div>
                  <span className="block font-medium text-foreground">
                    {t("Plan", "الخطة")}
                  </span>
                  {data.subscription.currentPlan}
                </div>
                <div>
                  <span className="block font-medium text-foreground">
                    {t("Statut", "الحالة")}
                  </span>
                  {data.subscription.currentStatus}
                </div>
                <div>
                  <span className="block font-medium text-foreground">
                    {t("Domaines magasins restants", "نطاقات المتاجر المتبقية")}
                  </span>
                  {data.subscription.remainingStoreDomains}
                </div>
              </div>
            ) : null}

            {!canEdit ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {t(
                  "Votre abonnement actuel ne permet pas de modifier les domaines. Réactivez ou passez à un plan supérieur.",
                  "اشتراكك الحالي لا يسمح بتعديل النطاقات. جدّد اشتراكك أو ارقِ خطتك."
                )}
              </div>
            ) : null}

            <form onSubmit={handleSave} className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-subdomain">
                  {t("Sous-domaine", "النطاق الفرعي")}
                </Label>
                <div className="flex items-stretch gap-0 overflow-hidden rounded-md border">
                  <Input
                    id="vendor-subdomain"
                    value={subdomainInput}
                    onChange={(e) =>
                      setSubdomainInput(e.target.value.toLowerCase())
                    }
                    placeholder="myvendor"
                    className="border-none shadow-none focus-visible:ring-0"
                    disabled={saving || !canEdit}
                  />
                  <span className="flex items-center border-l bg-muted px-3 text-xs text-muted-foreground">
                    .{apex}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Utilisez uniquement lettres, chiffres et tirets. Exemple: demo.",
                    "استخدم الأحرف والأرقام والشرطة فقط. مثال: demo."
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor-custom-domain">
                  {t("Domaine personnalisé", "نطاق مخصّص")}
                </Label>
                <Input
                  id="vendor-custom-domain"
                  value={customDomainInput}
                  onChange={(e) =>
                    setCustomDomainInput(e.target.value.toLowerCase())
                  }
                  placeholder="shop.mybrand.com"
                  disabled={saving || !canEditCustom}
                />
                {!data?.subscription?.allowVendorCustomDomain ? (
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="size-3" />
                    {t(
                      "Les domaines personnalisés nécessitent un plan supérieur.",
                      "النطاقات المخصّصة تتطلّب خطة أعلى."
                    )}
                  </p>
                ) : null}
                {canEditCustom ? (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Après l'enregistrement, ajoutez les DNS ci-dessous puis lancez la vérification.",
                      "بعد الحفظ، أضف سجلات DNS أدناه ثم شغّل التحقق."
                    )}
                  </p>
                ) : null}
              </div>

              {message ? (
                <p className="text-xs text-emerald-700">{message}</p>
              ) : null}
              {error ? (
                <p className="text-xs text-red-600">{error}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  disabled={saving || !canSave}
                >
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {hasChanges
                    ? t("Enregistrer", "حفظ")
                    : t("Aucun changement", "لا توجد تغييرات")}
                </Button>
                {data?.domains.customDomain && status !== "VERIFIED" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={verifying}
                    onClick={handleVerify}
                  >
                    {verifying ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 size-4" />
                    )}
                    {t("Vérifier le domaine", "تحقّق من النطاق")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={load}
                  disabled={loading}
                >
                  <RefreshCcw className="mr-2 size-4" />
                  {t("Actualiser", "تحديث")}
                </Button>
              </div>
            </form>

            {data?.verification?.records?.length ? (
              <DnsInstructions
                records={data.verification.records}
                copiedValue={copiedValue}
                onCopy={copyToClipboard}
                t={t}
              />
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function DomainPreviewTile({
  title,
  description,
  href,
  emptyLabel,
  copyLabel,
  openLabel,
  onCopy,
}: {
  title: string
  description: string
  href: string | null
  emptyLabel: string
  copyLabel: string
  openLabel: string
  onCopy: (value: string) => void
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-2 flex items-center gap-2">
        <LinkIcon className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {href ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs text-primary hover:underline"
          >
            {href}
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCopy(href)}
          >
            <Copy className="mr-1 size-3" />
            {copyLabel}
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <a href={href} target="_blank" rel="noreferrer">
              {openLabel}
            </a>
          </Button>
        </div>
      ) : (
        <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </div>
  )
}

function StatusBanner({
  status,
  t,
}: {
  status?: "PENDING" | "VERIFIED" | "FAILED"
  t: (fr: string, ar: string) => string
}) {
  if (!status) return null
  if (status === "VERIFIED") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <CheckCircle2 className="size-4" />
        {t("Votre vitrine est en ligne.", "واجهتك مباشرة على الإنترنت.")}
      </div>
    )
  }
  if (status === "FAILED") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        <ShieldAlert className="size-4" />
        {t(
          "La vérification DNS a échoué — vérifiez vos enregistrements et réessayez.",
          "فشل التحقق من DNS — تحقّق من السجلات وأعد المحاولة."
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <ShieldAlert className="size-4" />
      {t(
        "En attente — configurez vos DNS puis cliquez Vérifier.",
        "قيد الانتظار — أضف سجلات DNS ثم اضغط تحقّق."
      )}
    </div>
  )
}

function DnsInstructions({
  records,
  copiedValue,
  onCopy,
  t,
}: {
  records: Array<{ type: string; host: string; value: string; purpose: string }>
  copiedValue: string | null
  onCopy: (value: string) => void
  t: (fr: string, ar: string) => string
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Globe className="size-4" />
        {t("Enregistrements DNS à ajouter", "سجلات DNS المطلوبة")}
      </h4>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pr-3 py-1">{t("Type", "النوع")}</th>
              <th className="pr-3 py-1">{t("Hôte", "المضيف")}</th>
              <th className="pr-3 py-1">{t("Valeur", "القيمة")}</th>
              <th className="pr-3 py-1">{t("But", "الغرض")}</th>
              <th className="py-1"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr key={`${r.type}-${r.host}-${idx}`} className="border-t">
                <td className="py-1.5 pr-3 font-mono">{r.type}</td>
                <td className="py-1.5 pr-3 font-mono">{r.host}</td>
                <td className="py-1.5 pr-3 font-mono break-all">{r.value}</td>
                <td className="py-1.5 pr-3 text-muted-foreground">
                  {r.purpose}
                </td>
                <td className="py-1.5 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title={t("Copier", "نسخ")}
                    onClick={() => onCopy(`${r.type} ${r.host} ${r.value}`)}
                    className="h-7 px-2 text-xs"
                  >
                    <Copy className="mr-1 size-3" />
                    {copiedValue === `${r.type} ${r.host} ${r.value}`
                      ? t("Copié", "تم النسخ")
                      : t("Copier", "نسخ")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
