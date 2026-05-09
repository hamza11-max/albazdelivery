"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@albaz/ui"
import { Loader2, Megaphone, RefreshCw, Settings2, Ticket, Layers, MapPinned, Mail } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"
import { apiErrorMessage } from "../lib/api-error-message"
import { useAdminI18n } from "../lib/AdminI18nProvider"

function EmailTemplateRow({
  template: tmpl,
  onSaved,
  toast,
}: {
  template: {
    id: string
    key: string
    labelFr: string
    subjectFr: string
    bodyFr: string
    subjectAr?: string
    bodyAr?: string
  }
  onSaved: () => void
  toast: (opts: { title?: string; description?: string; variant?: "destructive" }) => void
}) {
  const { t } = useAdminI18n()
  const [labelFr, setLabelFr] = useState(tmpl.labelFr ?? "")
  const [subjectFr, setSubjectFr] = useState(tmpl.subjectFr ?? "")
  const [bodyFr, setBodyFr] = useState(tmpl.bodyFr ?? "")
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetchWithCsrf(`/api/admin/email-templates/${encodeURIComponent(tmpl.key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelFr, subjectFr, bodyFr }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: t("content.templateSaved"), description: tmpl.key })
        onSaved()
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("common.error")),
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: t("common.networkError"), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs text-muted-foreground">{tmpl.key}</p>
        <Button type="button" size="sm" disabled={busy} onClick={() => void save()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
        </Button>
      </div>
      <div>
        <Label>{t("content.fieldLabel")}</Label>
        <Input value={labelFr} onChange={(e) => setLabelFr(e.target.value)} />
      </div>
      <div>
        <Label>{t("content.fieldSubjectFr")}</Label>
        <Input value={subjectFr} onChange={(e) => setSubjectFr(e.target.value)} />
      </div>
      <div>
        <Label>{t("content.fieldBodyFr")}</Label>
        <Textarea value={bodyFr} onChange={(e) => setBodyFr(e.target.value)} rows={6} className="font-mono text-sm" />
      </div>
    </div>
  )
}

export function ContentOperationsView() {
  const { toast } = useToast()
  const { t, language } = useAdminI18n()
  const dateLocale = language === "ar" ? "ar-DZ" : "fr-FR"
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<Array<Record<string, unknown>>>([])
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([])
  const [promos, setPromos] = useState<Array<Record<string, unknown>>>([])
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)

  const [templates, setTemplates] = useState<Array<Record<string, unknown>>>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [z, c, p, cfg, em] = await Promise.all([
        fetch("/api/admin/delivery-zones", { credentials: "include" }),
        fetch("/api/admin/catalog-categories", { credentials: "include" }),
        fetch("/api/admin/promo-codes", { credentials: "include" }),
        fetch("/api/admin/system/config", { credentials: "include" }),
        fetch("/api/admin/email-templates", { credentials: "include" }),
      ])
      const [zj, cj, pj, cfgj, emj] = await Promise.all([z.json(), c.json(), p.json(), cfg.json(), em.json()])
      if (zj.success) setZones((zj.data?.zones as any) ?? [])
      if (cj.success) setCategories((cj.data?.categories as any) ?? [])
      if (pj.success) setPromos((pj.data?.promoCodes as any) ?? [])
      if (cfgj.success) setConfig((cfgj.data?.config as any) ?? null)
      if (emj.success) setTemplates((emj.data?.templates as any) ?? [])
    } catch (e) {
      console.error(e)
      toast({ title: t("content.loadError"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    refresh()
  }, [refresh])

  const [bcTitle, setBcTitle] = useState("")
  const [bcMsg, setBcMsg] = useState("")
  const [bcRole, setBcRole] = useState<string>("CUSTOMER")
  const [bcBusy, setBcBusy] = useState(false)

  const sendBroadcast = async () => {
    if (bcMsg.trim().length < 2) {
      toast({ title: t("content.messageTooShort"), variant: "destructive" })
      return
    }
    setBcBusy(true)
    try {
      const res = await fetchWithCsrf("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bcTitle.trim() || t("content.defaultBroadcastTitle"),
          message: bcMsg,
          type: "SYSTEM",
          recipientRole: bcRole,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: t("common.success"),
          description: t("content.notificationsSent", undefined, undefined, {
            count: String(data.data?.created ?? 0),
          }),
        })
        setBcMsg("")
      } else
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("common.error")),
          variant: "destructive",
        })
    } catch {
      toast({ title: t("common.networkError"), variant: "destructive" })
    } finally {
      setBcBusy(false)
    }
  }

  if (loading && !config) {
    return (
      <Card>
        <CardContent className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          <RefreshCw className="h-4 w-4 mr-1" /> {t("common.refresh")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            {t("content.integrationsTitle")}
          </CardTitle>
          <CardDescription>{t("content.integrationsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          {Array.isArray((config as any)?.integrationKeys) && (config as any).integrationKeys.length > 0 ? (
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-2">{t("content.thIntegration")}</th>
                  <th className="p-2">{t("content.thVariable")}</th>
                  <th className="p-2">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {(config as any).integrationKeys.map((row: any) => (
                  <tr key={row.id} className="border-b">
                    <td className="p-2">{row.label}</td>
                    <td className="p-2 font-mono text-xs">{row.envVar}</td>
                    <td className="p-2">
                      <Badge variant={row.configured ? "default" : "secondary"}>
                        {row.configured ? t("content.configured") : t("content.absent")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">{t("content.noIntegrationData")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t("content.emailTemplatesTitle")}
          </CardTitle>
          <CardDescription>{t("content.emailTemplatesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("content.noTemplates")}</p>
          ) : (
            templates.map((t: any) => (
              <EmailTemplateRow
                key={t.id}
                template={t}
                onSaved={() => void refresh()}
                toast={toast}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            {t("content.systemConfigTitle")}
          </CardTitle>
          <CardDescription>{t("content.systemConfigDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-primary" />
            {t("content.zonesTitle")}
          </CardTitle>
          <CardDescription>{t("content.zonesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          {zones.length === 0 ? (
            <p className="text-muted-foreground">{t("content.noZones")}</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-2">{t("content.thName")}</th>
                  <th className="p-2">{t("common.city")}</th>
                  <th className="p-2">{t("content.thFee")}</th>
                  <th className="p-2">{t("content.thActiveShort")}</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z: any) => (
                  <tr key={z.id} className="border-b">
                    <td className="p-2">{z.name}</td>
                    <td className="p-2">{z.city}</td>
                    <td className="p-2 tabular-nums">{z.deliveryFee}</td>
                    <td className="p-2">
                      <Badge variant={z.isActive ? "default" : "secondary"}>
                        {z.isActive ? t("content.yes") : t("content.no")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {t("content.categoriesTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">{t("content.thSlug")}</th>
                <th className="text-left p-2">{t("content.thNameFr")}</th>
                <th className="text-right p-2">{t("content.thStores")}</th>
                <th className="text-left p-2">{t("content.thActiveShort")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id} className="border-b">
                  <td className="p-2 font-mono text-xs">{c.slug}</td>
                  <td className="p-2">{c.nameFr}</td>
                  <td className="text-right p-2">{c._count?.stores ?? 0}</td>
                  <td className="p-2">
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      {c.isActive ? t("content.yes") : t("content.no")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {t("content.promosTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          {promos.length === 0 ? (
            <p className="text-muted-foreground">{t("content.noPromos")}</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">{t("content.thCode")}</th>
                  <th className="text-left p-2">{t("content.thType")}</th>
                  <th className="text-right p-2">{t("content.thValue")}</th>
                  <th className="text-left p-2">{t("content.thExpires")}</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p: any) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2 font-mono">{p.code}</td>
                    <td className="p-2">{p.discountType}</td>
                    <td className="text-right p-2 tabular-nums">{p.discountValue}</td>
                    <td className="p-2 text-xs">
                      {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString(dateLocale) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            {t("content.broadcastTitle")}
          </CardTitle>
          <CardDescription>{t("content.broadcastDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div>
            <Label>{t("content.labelTitle")}</Label>
            <Input
              value={bcTitle}
              onChange={(e) => setBcTitle(e.target.value)}
              placeholder={t("content.defaultBroadcastTitle")}
            />
          </div>
          <div>
            <Label>{t("content.labelMessage")}</Label>
            <Input value={bcMsg} onChange={(e) => setBcMsg(e.target.value)} />
          </div>
          <div>
            <Label>{t("content.labelRecipientRole")}</Label>
            <Select value={bcRole} onValueChange={setBcRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">{t("content.roleCustomers")}</SelectItem>
                <SelectItem value="VENDOR">{t("content.roleVendors")}</SelectItem>
                <SelectItem value="DRIVER">{t("content.roleDrivers")}</SelectItem>
                <SelectItem value="ADMIN">{t("content.roleAdmins")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" disabled={bcBusy} onClick={() => void sendBroadcast()}>
            {bcBusy ? <Loader2 className="animate-spin h-4 w-4" /> : t("content.send")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
