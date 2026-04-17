"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Badge } from "@/root/components/ui/badge"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { useToast } from "@/root/hooks/use-toast"
import { KeyRound, RefreshCw } from "lucide-react"

type CredentialStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED"

interface AdminCredentialRow {
  id: string
  userId: string
  vendor: {
    id: string
    name: string
    email: string
    status: string
  }
  credentialId: string
  nickname: string | null
  status: CredentialStatus
  createdAt: string
  approvedAt: string | null
  revokedAt: string | null
  revocationReason: string | null
}

export function WebAuthnPasskeysTab() {
  const passkeyFeatureEnabled =
    String(process.env.NEXT_PUBLIC_ALBAZ_FEATURE_WEBAUTHN_PASSKEYS || "").toLowerCase() === "true"
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<CredentialStatus | "ALL">("PENDING")
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<AdminCredentialRow[]>([])
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [actingId, setActingId] = useState<string | null>(null)

  const loadRows = useCallback(async () => {
    if (!passkeyFeatureEnabled) {
      setRows([])
      return
    }
    try {
      setLoading(true)
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`
      const response = await fetch(`/api/admin/webauthn-passkeys${query}`, {
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Failed to load WebAuthn passkeys")
      }
      setRows(data.data?.credentials || [])
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de charger les passkeys WebAuthn",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [passkeyFeatureEnabled, statusFilter, toast])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const moderate = async (id: string, action: "approve" | "reject" | "revoke") => {
    try {
      setActingId(id)
      const response = await fetch(`/api/admin/webauthn-passkeys/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reason: reasonById[id] || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Failed to update passkey status")
      }
      toast({
        title: "Succès",
        description:
          action === "approve"
            ? "Passkey approuvée"
            : action === "reject"
              ? "Passkey rejetée"
              : "Passkey révoquée",
      })
      await loadRows()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Mise à jour impossible",
        variant: "destructive",
      })
    } finally {
      setActingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Passkeys WebAuthn (modération)
            </CardTitle>
            <CardDescription>
              Approuvez, rejetez ou révoquez les passkeys enregistrées par les vendeurs.
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={loadRows} disabled={loading || !passkeyFeatureEnabled}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="max-w-xs space-y-1">
          <Label>Filtrer par statut</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={statusFilter}
            disabled={!passkeyFeatureEnabled}
            onChange={(event) => setStatusFilter(event.target.value as CredentialStatus | "ALL")}
          >
            <option value="ALL">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvés</option>
            <option value="REJECTED">Rejetés</option>
            <option value="REVOKED">Révoqués</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!passkeyFeatureEnabled && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
            Activez `NEXT_PUBLIC_ALBAZ_FEATURE_WEBAUTHN_PASSKEYS=true` et
            `ALBAZ_FEATURE_WEBAUTHN_PASSKEYS=true` pour utiliser cette section.
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendeur</TableHead>
                <TableHead>Credential ID</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    {loading ? "Chargement..." : "Aucune passkey trouvée"}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.vendor?.name || "—"}</span>
                      <span className="text-xs text-muted-foreground">{row.vendor?.email || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.credentialId}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "APPROVED"
                          ? "default"
                          : row.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(row.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Input
                      placeholder="Raison (optionnel)"
                      value={reasonById[row.id] || ""}
                      onChange={(event) =>
                        setReasonById((prev) => ({ ...prev, [row.id]: event.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={!passkeyFeatureEnabled || actingId === row.id || row.status === "APPROVED"}
                        onClick={() => moderate(row.id, "approve")}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!passkeyFeatureEnabled || actingId === row.id || row.status === "REJECTED"}
                        onClick={() => moderate(row.id, "reject")}
                      >
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!passkeyFeatureEnabled || actingId === row.id || row.status === "REVOKED"}
                        onClick={() => moderate(row.id, "revoke")}
                      >
                        Révoquer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
