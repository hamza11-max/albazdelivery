"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from "@albaz/ui"
import type { User as UserType } from "@/root/lib/types"
import type { PlanFeatures } from "@/root/lib/subscription-plans"
import { fetchWithCsrf } from "../lib/csrf-client"
import { apiErrorMessage } from "../lib/api-error-message"
import { createAdminT, getInitialAdminLanguage } from "../lib/i18n-admin"
import {
  CreditCard,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
} from "lucide-react"

type SubscriptionRow = {
  id: string
  userId: string
  user?: { id: string; name: string; email: string }
  plan: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  featureOverrides?: unknown
}

type SubscriptionStats = {
  total: number
  active: number
  cancelled: number
  expired: number
  trial: number
  totalRevenue: number
  monthlyRecurringRevenue: number
}

const PLANS = ["STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE"] as const
const STATUSES = ["ACTIVE", "TRIAL", "CANCELLED", "EXPIRED", "PAST_DUE"] as const
const SUPPORT_OPTS: PlanFeatures["support"][] = [
  "email",
  "email_phone",
  "priority",
  "dedicated",
]

type BoolSelect = "" | "true" | "false"

interface SubscriptionsManageViewProps {
  vendors: UserType[]
}

export function SubscriptionsManageView({ vendors }: SubscriptionsManageViewProps) {
  const { toast } = useToast()
  const t = useMemo(() => createAdminT(getInitialAdminLanguage()), [])
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [extendingId, setExtendingId] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createUserId, setCreateUserId] = useState("")
  const [createPlan, setCreatePlan] = useState<string>("STARTER")
  const [createDays, setCreateDays] = useState("30")
  const [creating, setCreating] = useState(false)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [planBaseline, setPlanBaseline] = useState<PlanFeatures | null>(null)
  const [effectiveEntitlements, setEffectiveEntitlements] = useState<PlanFeatures | null>(null)

  const [numMaxProducts, setNumMaxProducts] = useState("")
  const [numMaxUsers, setNumMaxUsers] = useState("")
  const [numMaxLocations, setNumMaxLocations] = useState("")
  const [numSalesHistory, setNumSalesHistory] = useState("")
  const [selCloud, setSelCloud] = useState<BoolSelect>("")
  const [selApi, setSelApi] = useState<BoolSelect>("")
  const [selWa, setSelWa] = useState<BoolSelect>("")
  const [selRfid, setSelRfid] = useState<BoolSelect>("")
  const [selSupport, setSelSupport] = useState<string>("")
  const [savingEnt, setSavingEnt] = useState(false)

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/subscriptions", { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setSubscriptions(data.data.subscriptions || [])
        setStats(data.data.stats || null)
      } else {
        throw new Error(apiErrorMessage(data.error, "Failed to load subscriptions"))
      }
    } catch (e: unknown) {
      toast({
        title: t("common.error", "Erreur", "خطأ"),
        description:
          e instanceof Error ? e.message : t("common.loading", "Chargement impossible", "تعذر التحميل"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchSubscriptions()
  }, [fetchSubscriptions])

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true)
      setDetailId(id)
      try {
        const res = await fetch(`/api/admin/subscriptions/${id}`, { credentials: "include" })
        const data = await res.json()
        if (!data.success) {
          throw new Error(apiErrorMessage(data.error, "Détail indisponible"))
        }
        const base = data.data.planBaseline as PlanFeatures
        const eff = data.data.effectiveEntitlements as PlanFeatures
        const raw = (data.data.featureOverrides || {}) as Record<string, unknown>
        setPlanBaseline(base)
        setEffectiveEntitlements(eff)

        const g = (k: string) => (raw[k] !== undefined ? String(raw[k]) : "")
        setNumMaxProducts(g("maxProducts"))
        setNumMaxUsers(g("maxUsers"))
        setNumMaxLocations(g("maxLocations"))
        setNumSalesHistory(g("salesHistoryMonths"))
        setSelCloud(raw.cloudSync === true ? "true" : raw.cloudSync === false ? "false" : "")
        setSelApi(raw.apiAccess === true ? "true" : raw.apiAccess === false ? "false" : "")
        setSelWa(raw.whatsappFlows === true ? "true" : raw.whatsappFlows === false ? "false" : "")
        setSelRfid(raw.rfid === true ? "true" : raw.rfid === false ? "false" : "")
        setSelSupport(typeof raw.support === "string" ? (raw.support as string) : "")
      } catch (e: unknown) {
        toast({
        title: t("common.error", "Erreur", "خطأ"),
        description:
          e instanceof Error ? e.message : t("admin.detailUnavailable", "Détail impossible", "تعذر عرض التفاصيل"),
          variant: "destructive",
        })
        setDetailId(null)
      } finally {
        setDetailLoading(false)
      }
    },
    [toast]
  )

  const resetDetailForm = () => {
    setPlanBaseline(null)
    setEffectiveEntitlements(null)
    setNumMaxProducts("")
    setNumMaxUsers("")
    setNumMaxLocations("")
    setNumSalesHistory("")
    setSelCloud("")
    setSelApi("")
    setSelWa("")
    setSelRfid("")
    setSelSupport("")
  }

  const buildEntitlementsPatch = (): Record<string, unknown> => {
    const body: Record<string, unknown> = {}
    const parseNum = (s: string, key: string) => {
      if (s.trim() === "") return
      const n = Number(s)
      if (!Number.isFinite(n)) return
      body[key] = n
    }
    parseNum(numMaxProducts, "maxProducts")
    parseNum(numMaxUsers, "maxUsers")
    parseNum(numMaxLocations, "maxLocations")
    parseNum(numSalesHistory, "salesHistoryMonths")
    if (selCloud === "true") body.cloudSync = true
    if (selCloud === "false") body.cloudSync = false
    if (selApi === "true") body.apiAccess = true
    if (selApi === "false") body.apiAccess = false
    if (selWa === "true") body.whatsappFlows = true
    if (selWa === "false") body.whatsappFlows = false
    if (selRfid === "true") body.rfid = true
    if (selRfid === "false") body.rfid = false
    if (selSupport && SUPPORT_OPTS.includes(selSupport as PlanFeatures["support"])) {
      body.support = selSupport
    }
    return body
  }

  const saveEntitlements = async () => {
    if (!detailId) return
    const body = buildEntitlementsPatch()
    if (Object.keys(body).length === 0) {
      toast({
        title: t("admin.nothingToSave", "Rien à enregistrer", "لا يوجد ما يُحفظ"),
        description: t("admin.changeAtLeastOne", "Modifiez au moins un champ.", "عدّل حقلاً واحداً على الأقل."),
      })
      return
    }
    setSavingEnt(true)
    try {
      const res = await fetchWithCsrf(`/api/admin/subscriptions/${detailId}/entitlements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(apiErrorMessage(data.error, "Enregistrement impossible"))
      }
      toast({
        title: t("common.success", "Succès", "نجح"),
        description: t("admin.featuresUpdated", "Fonctionnalités mises à jour.", "تم تحديث الميزات."),
      })
      await fetchSubscriptions()
      await loadDetail(detailId)
    } catch (e: unknown) {
      toast({
        title: t("common.error", "Erreur", "خطأ"),
        description: e instanceof Error ? e.message : "Échec",
        variant: "destructive",
      })
    } finally {
      setSavingEnt(false)
    }
  }

  const handleExtend = async (subId: string, days: number) => {
    setExtendingId(subId)
    try {
      const res = await fetchWithCsrf(`/api/admin/subscriptions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extendDays: days }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(apiErrorMessage(data.error, "Échec prolongation"))
      }
      toast({
        title: t("admin.extended", "Prolongé", "تم التمديد"),
        description: `+${days} ` + t("admin.days", "jours", "يوماً"),
      })
      await fetchSubscriptions()
    } catch (e: unknown) {
      toast({
        title: t("common.error", "Erreur", "خطأ"),
        description: e instanceof Error ? e.message : "Impossible",
        variant: "destructive",
      })
    } finally {
      setExtendingId(null)
    }
  }

  const handlePatchPlanStatus = async (subId: string, plan?: string, status?: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/subscriptions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, status }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(apiErrorMessage(data.error, "Mise à jour impossible"))
      }
      toast({ title: t("admin.updated", "Mis à jour", "تم التحديث") })
      await fetchSubscriptions()
    } catch (e: unknown) {
      toast({
        title: t("common.error", "Erreur", "خطأ"),
        description: e instanceof Error ? e.message : "Échec",
        variant: "destructive",
      })
    }
  }

  const handleCreate = async () => {
    if (!createUserId) {
      toast({ title: t("admin.pickVendor", "Choisir un vendeur", "اختر بائعاً"), variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetchWithCsrf("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createUserId,
          plan: createPlan,
          durationDays: Math.max(1, parseInt(createDays, 10) || 30),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(apiErrorMessage(data.error, "Création impossible"))
      }
      toast({ title: t("admin.subscriptionCreated", "Abonnement créé", "تم إنشاء الاشتراك") })
      setCreateOpen(false)
      setCreateUserId("")
      await fetchSubscriptions()
    } catch (e: unknown) {
      toast({
        title: t("common.error", "Erreur", "خطأ"),
        description: e instanceof Error ? e.message : "Échec",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        sub.user?.name?.toLowerCase().includes(q) ||
        sub.user?.email?.toLowerCase().includes(q) ||
        sub.id.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter
      const matchesPlan = planFilter === "all" || sub.plan === planFilter
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [subscriptions, searchQuery, statusFilter, planFilter])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-7 w-7" />
            {t("admin.subscriptionsAndFeatures", "Abonnements & fonctionnalités", "الاشتراكات والميزات")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              "admin.subscriptionsHelp",
              "Gérer les plans, durées et sélections de fonctionnalités par vendeur (overrides).",
              "إدارة الخطط والمدد واختيارات الميزات لكل بائع (تجاوزات)."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchSubscriptions()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nouvel abonnement
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Total", stats.total],
            ["Actifs", stats.active],
            ["Essai", stats.trial],
            ["Annulés", stats.cancelled],
            ["Expirés", stats.expired],
          ].map(([k, v]) => (
            <Card key={String(k)}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{k}</CardTitle>
                <p className="text-2xl font-bold">{v}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Liste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous plans</SelectItem>
                {PLANS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Fin période</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">{sub.user?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{sub.user?.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sub.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(sub.currentPeriodEnd)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={extendingId === sub.id}
                          onClick={() => void handleExtend(sub.id, 30)}
                        >
                          +30j
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => void loadDetail(sub.id)}
                        >
                          <Settings2 className="h-4 w-4 mr-1" />
                          Fonctions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">Aucun abonnement</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel abonnement</DialogTitle>
            <DialogDescription>Créer un abonnement pour un compte vendeur existant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Vendeur</Label>
              <Select value={createUserId} onValueChange={setCreateUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name || v.email} ({v.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan</Label>
              <Select value={createPlan} onValueChange={setCreatePlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Durée (jours)</Label>
              <Input value={createDays} onChange={(e) => setCreateDays(e.target.value)} type="number" min={1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detailId)}
        onOpenChange={(o) => {
          if (!o) {
            setDetailId(null)
            resetDetailForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Fonctionnalités effectives</DialogTitle>
            <DialogDescription>
              Les valeurs ci-dessous sont fusionnées avec le plan. Laissez vide pour ne pas envoyer de
              changement sur ce champ (overrides existants restent en base sauf si vous ré-enregistrez une
              nouvelle valeur).
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : effectiveEntitlements && planBaseline ? (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                <div>
                  <span className="text-muted-foreground">Plan (sans override) — max produits:</span>{" "}
                  {planBaseline.maxProducts === -1 ? "∞" : planBaseline.maxProducts}
                </div>
                <div>
                  <span className="text-muted-foreground">Effectif — max produits:</span>{" "}
                  {effectiveEntitlements.maxProducts === -1 ? "∞" : effectiveEntitlements.maxProducts}
                </div>
                <div>
                  <span className="text-muted-foreground">Effectif — cloud sync:</span>{" "}
                  {String(effectiveEntitlements.cloudSync)}
                </div>
                <div>
                  <span className="text-muted-foreground">Effectif — support:</span>{" "}
                  {effectiveEntitlements.support}
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label>maxProducts (-1 = illimité)</Label>
                  <Input value={numMaxProducts} onChange={(e) => setNumMaxProducts(e.target.value)} />
                </div>
                <div>
                  <Label>maxUsers</Label>
                  <Input value={numMaxUsers} onChange={(e) => setNumMaxUsers(e.target.value)} />
                </div>
                <div>
                  <Label>maxLocations</Label>
                  <Input value={numMaxLocations} onChange={(e) => setNumMaxLocations(e.target.value)} />
                </div>
                <div>
                  <Label>salesHistoryMonths</Label>
                  <Input value={numSalesHistory} onChange={(e) => setNumSalesHistory(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["cloudSync", selCloud, setSelCloud],
                      ["apiAccess", selApi, setSelApi],
                      ["whatsappFlows", selWa, setSelWa],
                      ["rfid", selRfid, setSelRfid],
                    ] as const
                  ).map(([label, val, setV]) => (
                    <div key={label}>
                      <Label>{label}</Label>
                      <Select
                        value={val ? val : "unset"}
                        onValueChange={(v) => setV((v === "unset" ? "" : v) as BoolSelect)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="non défini" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">(non défini)</SelectItem>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div>
                  <Label>support</Label>
                  <Select value={selSupport || "unset"} onValueChange={(v) => setSelSupport(v === "unset" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="(non défini)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">(non défini)</SelectItem>
                      {SUPPORT_OPTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => void saveEntitlements()} disabled={savingEnt}>
                    {savingEnt && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Enregistrer overrides
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => detailId && void handlePatchPlanStatus(detailId, "PROFESSIONAL")}
                  >
                    Forcer plan PRO
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => detailId && void handlePatchPlanStatus(detailId, undefined, "ACTIVE")}
                  >
                    Statut ACTIVE
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
