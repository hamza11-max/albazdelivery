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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/root/components/ui/collapsible"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { ChevronDown, Loader2, Store } from "lucide-react"
import { DnsInstructions, StatusBanner } from "./VendorDomainsCard"

interface StoreDomainsSectionProps {
  vendorId: string | null
  translate: (fr: string, ar: string) => string
}

interface StoreRow {
  id: string
  name: string
}

interface StoreDomainPayload {
  storeId: string
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

export function StoreDomainsSection({
  vendorId,
  translate,
}: StoreDomainsSectionProps) {
  const t = translate || defaultT
  const [stores, setStores] = useState<StoreRow[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const loadStores = useCallback(async () => {
    if (!vendorId) {
      setStores([])
      return
    }
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch(
        `/api/stores?vendorId=${encodeURIComponent(vendorId)}&includeInactive=true&limit=100`,
        { credentials: "include" }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(
          err?.error?.message || t("Impossible de charger les magasins", "تعذر تحميل المتاجر")
        )
      }
      const json = await res.json()
      const payload = json?.data ?? json
      const raw = payload?.stores ?? []
      setStores(
        raw.map((s: { id: string; name: string }) => ({
          id: s.id,
          name: s.name || s.id,
        }))
      )
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e))
      setStores([])
    } finally {
      setListLoading(false)
    }
  }, [vendorId, t])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  if (!vendorId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="size-5" />
            {t("Domaines par magasin", "نطاقات كل متجر")}
          </CardTitle>
          <CardDescription>
            {t(
              "Sélectionnez un vendeur pour gérer les domaines des magasins.",
              "اختر تاجراً لإدارة نطاقات المتاجر."
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="size-5" />
          {t("Domaines par magasin", "نطاقات كل متجر")}
        </CardTitle>
        <CardDescription>
          {t(
            "Remplace la vitrine vendeur pour ce magasin (sous-domaine ou domaine sur votre marque).",
            "تجاوز واجهة التاجر لهذا المتجر (نطاق فرعي أو نطاق مخصص لعلامتك)."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {listLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("Chargement des magasins…", "جاري تحميل المتاجر…")}
          </div>
        ) : null}
        {listError ? (
          <p className="text-sm text-red-600">{listError}</p>
        ) : null}
        {!listLoading && stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("Aucun magasin pour ce vendeur.", "لا يوجد متجر لهذا التاجر.")}
          </p>
        ) : null}
        {stores.map((s) => (
          <StoreDomainEditor
            key={s.id}
            storeId={s.id}
            storeName={s.name}
            translate={translate}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function StoreDomainEditor({
  storeId,
  storeName,
  translate,
}: {
  storeId: string
  storeName: string
  translate: (fr: string, ar: string) => string
}) {
  const t = translate
  const apex = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_BASE_DOMAIN || "al-baz.app") as string,
    []
  )

  const [open, setOpen] = useState(false)
  const [data, setData] = useState<StoreDomainPayload | null>(null)
  const [verification, setVerification] = useState<
    StoreDomainPayload["verification"] | undefined
  >()
  const [loading, setLoading] = useState(false)
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
      const res = await fetch(`/api/stores/${storeId}/domains`, {
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(
          err?.error?.message || t("Échec du chargement", "فشل التحميل")
        )
      }
      const json = await res.json()
      const payload = (json?.data || json) as StoreDomainPayload
      setData(payload)
      setSubdomainInput(payload.domains.subdomain || "")
      setCustomDomainInput(payload.domains.customDomain || "")
      setVerification(undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [storeId, t])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/stores/${storeId}/domains`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomainInput.trim() || null,
          customDomain: customDomainInput.trim() || null,
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
      const payload = (json?.data || json) as StoreDomainPayload
      setData(payload)
      setVerification(payload.verification)
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
      const res = await fetch(`/api/stores/${storeId}/domains/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(
          err?.error?.message ||
            t("Échec de la vérification", "فشل التحقق")
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
  const savedSubdomain = data?.domains.subdomain || ""
  const savedCustomDomain = data?.domains.customDomain || ""
  const hasChanges =
    normalizedSubdomain !== savedSubdomain ||
    normalizedCustomDomain !== savedCustomDomain
  const maxStore = data?.subscription.maxStoreCustomDomains ?? 0
  const planAllowsStoreCustom = maxStore > 0 || maxStore < 0
  const hasCustomOnThisStore = Boolean(savedCustomDomain)
  const remaining = data?.subscription.remainingStoreDomains ?? 0
  const canEditCustom =
    planAllowsStoreCustom &&
    (hasCustomOnThisStore || remaining > 0 || maxStore < 0)
  const canSave =
    Boolean(normalizedSubdomain || normalizedCustomDomain) && hasChanges

  const copyToClipboard = useCallback(async (value: string) => {
    try {
      await navigator.clipboard?.writeText(value)
      setCopiedValue(value)
      window.setTimeout(() => setCopiedValue(null), 1500)
    } catch {
      // optional
    }
  }, [])

  const dnsRecords =
    verification?.records?.length ? verification.records : null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40">
        <span className="font-medium text-sm">{storeName}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-3 py-3 space-y-3">
        {!data && loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("Chargement…", "جاري التحميل…")}
          </div>
        ) : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        {data ? (
          <>
            <StatusBanner status={status} t={t} />
            <form onSubmit={handleSave} className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`sd-${storeId}`}>
                  {t("Sous-domaine magasin", "النطاق الفرعي للمتجر")}
                </Label>
                <div className="flex items-stretch gap-0 overflow-hidden rounded-md border">
                  <Input
                    id={`sd-${storeId}`}
                    value={subdomainInput}
                    onChange={(e) =>
                      setSubdomainInput(e.target.value.toLowerCase())
                    }
                    placeholder="my-store"
                    className="border-none shadow-none focus-visible:ring-0"
                    disabled={saving}
                  />
                  <span className="flex items-center border-l bg-muted px-3 text-xs text-muted-foreground">
                    .{apex}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`cd-${storeId}`}>
                  {t("Domaine personnalisé", "نطاق مخصّص")}
                </Label>
                <Input
                  id={`cd-${storeId}`}
                  value={customDomainInput}
                  onChange={(e) =>
                    setCustomDomainInput(e.target.value.toLowerCase())
                  }
                  placeholder="shop.mybrand.com"
                  disabled={saving || !canEditCustom}
                />
                {!planAllowsStoreCustom ? (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Votre plan n’inclut pas de domaine personnalisé par magasin.",
                      "خطتك لا تشمل نطاقاً مخصّصاً لكل متجر."
                    )}
                  </p>
                ) : !canEditCustom ? (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Limite de domaines magasins atteinte pour un nouveau domaine.",
                      "بلغت الحد الأقصى لنطاقات المتاجر الجديدة."
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Enregistrez puis configurez les DNS si vous utilisez un domaine personnalisé.",
                      "احفظ ثم أضف سجلات DNS إذا استخدمت نطاقاً مخصّصاً."
                    )}
                  </p>
                )}
              </div>
              {message ? (
                <p className="text-xs text-emerald-700">{message}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving || !canSave}>
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {t("Enregistrer", "حفظ")}
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
                    ) : null}
                    {t("Vérifier le domaine", "تحقّق من النطاق")}
                  </Button>
                ) : null}
              </div>
            </form>
            {dnsRecords ? (
              <DnsInstructions
                records={dnsRecords}
                copiedValue={copiedValue}
                onCopy={copyToClipboard}
                t={t}
              />
            ) : null}
          </>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}
