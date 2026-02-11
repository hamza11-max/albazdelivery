\"use client\"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Badge } from "@/root/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { KeyRound, RefreshCw, Copy, CheckCircle2, AlertTriangle } from "lucide-react"

interface PasskeyRecord {
  id: string
  subscriptionId: string
  createdAt: string
  expiresAt: string | null
  usedAt: string | null
  createdBy: string | null
  vendor: {
    id: string
    email: string | null
    name: string | null
  } | null
}

interface PasskeysTabProps {
  translate?: (fr: string, ar: string) => string
}

export function PasskeysTab({ translate = (fr) => fr }: PasskeysTabProps) {
  const { toast } = useToast()
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [vendorEmail, setVendorEmail] = useState("")
  const [subscriptionId, setSubscriptionId] = useState("")
  const [expiresInDays, setExpiresInDays] = useState<string>("7")
  const [generatedPasskey, setGeneratedPasskey] = useState<string | null>(null)
  const [generatedMeta, setGeneratedMeta] = useState<{ subscriptionId: string; expiresAt: string | null } | null>(null)
  const [copied, setCopied] = useState(false)

  const loadPasskeys = async () => {
    try {
      setLoadingList(true)
      const res = await fetch("/api/admin/subscription-passkeys?limit=50")
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load passkeys")
      }
      setPasskeys(data.data.passkeys || [])
    } catch (error: any) {
      toast({
        title: translate("Erreur lors du chargement", "حدث خطأ أثناء التحميل"),
        description: error.message || translate("Impossible de récupérer les passkeys", "تعذر استرجاع مفاتيح المرور"),
        variant: "destructive",
      })
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadPasskeys()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscriptionId && !vendorEmail) {
      toast({
        title: translate("Informations manquantes", "المعلومات ناقصة"),
        description: translate("Entrez un email vendeur ou un ID d'abonnement", "أدخل بريد البائع أو معرف الاشتراك"),
        variant: "destructive",
      })
      return
    }

    try {
      setLoadingGenerate(true)
      setGeneratedPasskey(null)
      setGeneratedMeta(null)
      setCopied(false)

      const res = await fetch("/api/admin/subscription-passkeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscriptionId || undefined,
          vendorEmail: vendorEmail || undefined,
          expiresInDays: expiresInDays === "none" ? null : Number(expiresInDays) || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate passkey")
      }

      setGeneratedPasskey(data.data.passkey)
      setGeneratedMeta({
        subscriptionId: data.data.subscriptionId,
        expiresAt: data.data.expiresAt || null,
      })
      toast({
        title: translate("Passkey générée", "تم إنشاء مفتاح المرور"),
        description: translate("Partagez ce code avec le client pour activer son abonnement.", "شارك هذا الرمز مع الزبون لتفعيل اشتراكه."),
      })
      loadPasskeys()
    } catch (error: any) {
      toast({
        title: translate("Erreur lors de la génération", "حدث خطأ أثناء الإنشاء"),
        description: error.message || translate("Impossible de générer une passkey", "تعذر إنشاء مفتاح مرور"),
        variant: "destructive",
      })
    } finally {
      setLoadingGenerate(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedPasskey || typeof navigator === "undefined" || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(generatedPasskey)
      setCopied(true)
      toast({
        title: translate("Copié dans le presse-papiers", "تم النسخ إلى الحافظة"),
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: translate("Impossible de copier", "تعذر النسخ"),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              {translate("Générer des passkeys d'abonnement", "إنشاء مفاتيح مرور للاشتراك")}
            </CardTitle>
            <CardDescription>
              {translate(
                "Créez des codes uniques liés à chaque abonnement pour activer ALBAZ sur les appareils des clients.",
                "أنشئ رموزاً فريدة مرتبطة بكل اشتراك لتفعيل ALBAZ على أجهزة الزبائن."
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={loadPasskeys} disabled={loadingList}>
            <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" onSubmit={handleGenerate}>
            <div className="space-y-2">
              <Label>{translate("Email du vendeur (optionnel)", "بريد البائع (اختياري)")}</Label>
              <Input
                type="email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("ID d'abonnement (optionnel)", "معرّف الاشتراك (اختياري)")}</Label>
              <Input
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                placeholder="sub_xxx"
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("Expiration", "تاريخ الانتهاء")}</Label>
              <select
                className="border rounded-md px-3 py-2 bg-background"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              >
                <option value="7">{translate("7 jours", "7 أيام")}</option>
                <option value="30">{translate("30 jours", "30 يوماً")}</option>
                <option value="90">{translate("90 jours", "90 يوماً")}</option>
                <option value="none">{translate("Sans expiration", "بدون انتهاء")}</option>
              </select>
            </div>
            <div className="md:col-span-3 flex flex-col md:flex-row md:items-end gap-3">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={loadingGenerate}
              >
                {loadingGenerate
                  ? translate("Génération...", "جاري الإنشاء...")
                  : translate("Générer une passkey", "إنشاء مفتاح مرور")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {translate(
                  "Entrez soit l'email du vendeur, soit l'ID d'abonnement. Le passkey sera lié à cet abonnement.",
                  "أدخل بريد البائع أو معرف الاشتراك. سيتم ربط مفتاح المرور بهذا الاشتراك."
                )}
              </p>
            </div>
          </form>

          {generatedPasskey && (
            <Card className="mb-6 border-primary/40 bg-primary/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      {translate("Passkey générée pour l'abonnement", "تم إنشاء مفتاح مرور للاشتراك")}:{" "}
                      <Badge variant="outline">{generatedMeta?.subscriptionId}</Badge>
                    </p>
                    {generatedMeta?.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        {translate("Expire le", "ينتهي في")}{" "}
                        {new Date(generatedMeta.expiresAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs uppercase text-muted-foreground">
                      {translate("Code à communiquer au client", "الرمز الذي يتم مشاركته مع الزبون")}
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input readOnly value={generatedPasskey} className="font-mono font-semibold text-lg" />
                      <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-muted-foreground">
              {translate(
                "Les passkeys sont à usage unique : une fois utilisées, elles ne peuvent plus être réutilisées.",
                "مفاتيح المرور تُستخدم مرة واحدة فقط: بعد استخدامها لا يمكن استعمالها مجدداً."
              )}
            </p>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Abonnement", "الاشتراك")}</TableHead>
                  <TableHead>{translate("Vendeur", "البائع")}</TableHead>
                  <TableHead>{translate("Créée le", "تاريخ الإنشاء")}</TableHead>
                  <TableHead>{translate("Expiration", "الانتهاء")}</TableHead>
                  <TableHead>{translate("Statut", "الحالة")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passkeys.length === 0 && !loadingList && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                      {translate("Aucune passkey pour le moment", "لا توجد مفاتيح مرور حالياً")}
                    </TableCell>
                  </TableRow>
                )}
                {passkeys.map((pk) => {
                  const isExpired = pk.expiresAt ? new Date(pk.expiresAt).getTime() < Date.now() : false
                  const isUsed = !!pk.usedAt
                  let statusLabel = translate("Active", "نشط")
                  let statusVariant: "default" | "secondary" | "destructive" = "default"
                  if (isUsed) {
                    statusLabel = translate("Utilisée", "مستخدمة")
                    statusVariant = "secondary"
                  } else if (isExpired) {
                    statusLabel = translate("Expirée", "منتهية")
                    statusVariant = "destructive"
                  }

                  return (
                    <TableRow key={pk.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs">{pk.subscriptionId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pk.vendor ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{pk.vendor.name || pk.vendor.email || "—"}</span>
                            {pk.vendor.email && (
                              <span className="text-xs text-muted-foreground">{pk.vendor.email}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(pk.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pk.expiresAt ? new Date(pk.expiresAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {loadingList && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-4">
                      {translate("Chargement des passkeys...", "جاري تحميل مفاتيح المرور...")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

