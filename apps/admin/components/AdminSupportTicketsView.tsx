"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@albaz/ui"
import { LifeBuoy, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"

type TicketRow = {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  createdAt: string
  customer: { id: string; name: string | null; email: string | null }
}

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const

export function AdminSupportTicketsView() {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "100", page: "1" })
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/support/tickets?${params}`, { credentials: "include" })
      const data = await res.json()
      if (data.success && data.data?.tickets) {
        setTickets(data.data.tickets)
      } else {
        setTickets([])
        toast({
          title: "Erreur",
          description: data.error?.message || "Chargement impossible",
          variant: "destructive",
        })
      }
    } catch {
      setTickets([])
      toast({ title: "Erreur", description: "Réseau", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    void load()
  }, [load])

  const patchStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetchWithCsrf(`/api/support/tickets/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Mis à jour", description: "Statut du ticket enregistré." })
        void load()
      } else {
        toast({
          title: "Erreur",
          description: data.error?.message || "Échec de la mise à jour",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Erreur", description: "Réessayez.", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const openCount = tickets.filter((t) => t.status === "OPEN").length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <LifeBuoy className="h-5 w-5 shrink-0" />
            Support — tickets
            {statusFilter === "ALL" && openCount > 0 && (
              <Badge variant="destructive" className="font-normal">
                {openCount} ouvert(s) (page courante)
              </Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={() => void load()} aria-label="Actualiser">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun ticket pour ce filtre.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <Card key={t.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{t.subject}</p>
                        <p className="font-mono text-xs text-muted-foreground">{t.id}</p>
                      </div>
                      <Badge variant="outline">{t.priority}</Badge>
                    </div>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{t.description}</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Client: {t.customer?.name || t.customer?.email || t.customer?.id}
                      </span>
                      <span>• {t.category}</span>
                      <span>• {new Date(t.createdAt).toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                      <span className="text-sm text-muted-foreground">Statut</span>
                      <Select value={t.status} disabled={updatingId === t.id} onValueChange={(v) => void patchStatus(t.id, v)}>
                        <SelectTrigger className="h-9 w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {updatingId === t.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
