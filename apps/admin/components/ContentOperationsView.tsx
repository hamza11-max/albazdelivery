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
} from "@albaz/ui"
import { Loader2, Megaphone, RefreshCw, Settings2, Ticket, Layers, MapPinned } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"

export function ContentOperationsView() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<Array<Record<string, unknown>>>([])
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([])
  const [promos, setPromos] = useState<Array<Record<string, unknown>>>([])
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [z, c, p, cfg] = await Promise.all([
        fetch("/api/admin/delivery-zones", { credentials: "include" }),
        fetch("/api/admin/catalog-categories", { credentials: "include" }),
        fetch("/api/admin/promo-codes", { credentials: "include" }),
        fetch("/api/admin/system/config", { credentials: "include" }),
      ])
      const [zj, cj, pj, cfgj] = await Promise.all([z.json(), c.json(), p.json(), cfg.json()])
      if (zj.success) setZones((zj.data?.zones as any) ?? [])
      if (cj.success) setCategories((cj.data?.categories as any) ?? [])
      if (pj.success) setPromos((pj.data?.promoCodes as any) ?? [])
      if (cfgj.success) setConfig((cfgj.data?.config as any) ?? null)
    } catch (e) {
      console.error(e)
      toast({ title: "Erreur chargement", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const [bcTitle, setBcTitle] = useState("Annonce")
  const [bcMsg, setBcMsg] = useState("")
  const [bcRole, setBcRole] = useState<string>("CUSTOMER")
  const [bcBusy, setBcBusy] = useState(false)

  const sendBroadcast = async () => {
    if (bcMsg.trim().length < 2) {
      toast({ title: "Message trop court", variant: "destructive" })
      return
    }
    setBcBusy(true)
    try {
      const res = await fetchWithCsrf("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bcTitle,
          message: bcMsg,
          type: "SYSTEM",
          recipientRole: bcRole,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Notifications envoyées", description: `Créées : ${data.data?.created ?? 0}` })
        setBcMsg("")
      } else toast({ title: "Erreur", description: data.error, variant: "destructive" })
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" })
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
          <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Configuration système (lecture seule)
          </CardTitle>
          <CardDescription>Variables non sensibles pour le diagnostic.</CardDescription>
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
            Zones de livraison
          </CardTitle>
          <CardDescription>
            Gestion via API — création complexe (polygone). Utilisez l’API ou dupliquez une zone existante côté DB en phase ultérieure.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          {zones.length === 0 ? (
            <p className="text-muted-foreground">Aucune zone</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-2">Nom</th>
                  <th className="p-2">Ville</th>
                  <th className="p-2">Frais</th>
                  <th className="p-2">Actif</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z: any) => (
                  <tr key={z.id} className="border-b">
                    <td className="p-2">{z.name}</td>
                    <td className="p-2">{z.city}</td>
                    <td className="p-2 tabular-nums">{z.deliveryFee}</td>
                    <td className="p-2">
                      <Badge variant={z.isActive ? "default" : "secondary"}>{z.isActive ? "oui" : "non"}</Badge>
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
            Catégories catalogue
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">Slug</th>
                <th className="text-left p-2">Nom FR</th>
                <th className="text-right p-2">Magasins</th>
                <th className="text-left p-2">Actif</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id} className="border-b">
                  <td className="p-2 font-mono text-xs">{c.slug}</td>
                  <td className="p-2">{c.nameFr}</td>
                  <td className="text-right p-2">{c._count?.stores ?? 0}</td>
                  <td className="p-2">
                    <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "oui" : "non"}</Badge>
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
            Codes promo
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          {promos.length === 0 ? (
            <p className="text-muted-foreground">Aucun code</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">Code</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-right p-2">Valeur</th>
                  <th className="text-left p-2">Expire</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p: any) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2 font-mono">{p.code}</td>
                    <td className="p-2">{p.discountType}</td>
                    <td className="text-right p-2 tabular-nums">{p.discountValue}</td>
                    <td className="p-2 text-xs">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("fr-FR") : "—"}</td>
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
            Notification plateforme
          </CardTitle>
          <CardDescription>
            Envoie une notification in-app (type SYSTEM) à tous les utilisateurs du rôle choisi (max 500 par défaut côté API).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div>
            <Label>Titre</Label>
            <Input value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} />
          </div>
          <div>
            <Label>Message</Label>
            <Input value={bcMsg} onChange={(e) => setBcMsg(e.target.value)} />
          </div>
          <div>
            <Label>Rôle destinataires</Label>
            <Select value={bcRole} onValueChange={setBcRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Clients</SelectItem>
                <SelectItem value="VENDOR">Vendeurs</SelectItem>
                <SelectItem value="DRIVER">Livreurs</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" disabled={bcBusy} onClick={() => void sendBroadcast()}>
            {bcBusy ? <Loader2 className="animate-spin h-4 w-4" /> : "Envoyer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
