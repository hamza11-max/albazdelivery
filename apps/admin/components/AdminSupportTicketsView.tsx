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
import { useAdminI18n } from "../lib/AdminI18nProvider"

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
  const { t, language } = useAdminI18n()
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
          title: t("common.error"),
          description: data.error?.message || t("supportTickets.loadError"),
          variant: "destructive",
        })
      }
    } catch {
      setTickets([])
      toast({ title: t("common.error"), description: t("supportTickets.network"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast, t])

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
        toast({ title: t("supportTickets.updatedTitle"), description: t("supportTickets.updatedDesc") })
        void load()
      } else {
        toast({
          title: t("common.error"),
          description: data.error?.message || t("supportTickets.patchFail"),
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: t("common.error"), description: t("supportTickets.retry"), variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const openCount = tickets.filter((row) => row.status === "OPEN").length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <LifeBuoy className="h-5 w-5 shrink-0" />
            {t("supportTickets.title")}
            {statusFilter === "ALL" && openCount > 0 && (
              <Badge variant="destructive" className="font-normal">
                {t("supportTickets.openOnPage", undefined, undefined, { count: String(openCount) })}
              </Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("users.allStatuses")}</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void load()}
              aria-label={t("common.refresh")}
            >
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
            <p className="py-8 text-center text-sm text-muted-foreground">{t("supportTickets.emptyFilter")}</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{ticket.subject}</p>
                        <p className="font-mono text-xs text-muted-foreground">{ticket.id}</p>
                      </div>
                      <Badge variant="outline">{ticket.priority}</Badge>
                    </div>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {t("supportTickets.client")}: {ticket.customer?.name || ticket.customer?.email || ticket.customer?.id}
                      </span>
                      <span>• {ticket.category}</span>
                      <span>• {new Date(ticket.createdAt).toLocaleString(language === "ar" ? "ar-DZ" : "fr-FR")}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                      <span className="text-sm text-muted-foreground">{t("common.status")}</span>
                      <Select value={ticket.status} disabled={updatingId === ticket.id} onValueChange={(v) => void patchStatus(ticket.id, v)}>
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
                      {updatingId === ticket.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
