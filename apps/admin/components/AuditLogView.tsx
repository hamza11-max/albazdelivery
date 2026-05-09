"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@albaz/ui"
import { Search, Filter, Download } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"
import { useAdminI18n } from "../lib/AdminI18nProvider"

const SELECT_ALL = "__all__"

interface AuditLog {
  id: string
  userId?: string
  userRole?: string
  action: string
  resource: string
  resourceId?: string
  status: "SUCCESS" | "FAILURE"
  errorMessage?: string
  createdAt: Date
  details?: any
}

export function AuditLogView() {
  const { toast } = useToast()
  const { t, language } = useAdminI18n()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: "",
    resource: "",
    status: "",
    startDate: "",
    endDate: "",
    search: "",
  })

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.action) params.append("action", filters.action)
      if (filters.resource) params.append("resource", filters.resource)
      if (filters.status) params.append("status", filters.status)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: "include",
      })
      const data = await response.json()
      setLogs(data?.data?.logs || [])
    } catch (error) {
      console.error("[Admin] Error fetching audit logs:", error)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filters.action, filters.resource, filters.status, filters.startDate, filters.endDate])

  const filteredLogs = filters.search
    ? logs.filter(
        (log) =>
          log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
          log.resource.toLowerCase().includes(filters.search.toLowerCase()) ||
          (log.userRole && log.userRole.toLowerCase().includes(filters.search.toLowerCase()))
      )
    : logs

  const trAction = (code: string) => t(`audit.action.${code}`, code, code)
  const trResource = (code: string) => t(`audit.resource.${code}`, code, code)
  const trStatus = (code: string) => t(`audit.status.${code}`, code, code)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("audit.title")}</h2>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const response = await fetchWithCsrf("/api/admin/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "audit-logs",
                  format: "csv",
                  filters: {
                    action: filters.action || undefined,
                    resource: filters.resource || undefined,
                    status: filters.status || undefined,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                  },
                }),
              })

              if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `audit-logs_${new Date().toISOString().split("T")[0]}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toast({
                  title: t("common.success"),
                  description: t("audit.exportSuccess"),
                })
              } else {
                throw new Error("Export failed")
              }
            } catch {
              toast({
                title: t("common.error"),
                description: t("audit.exportError"),
                variant: "destructive",
              })
            }
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          {t("common.export")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t("audit.advancedFilters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t("audit.action")}</label>
              <Select
                value={filters.action === "" ? SELECT_ALL : filters.action}
                onValueChange={(value) =>
                  setFilters({ ...filters, action: value === SELECT_ALL ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("audit.allActions")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>{t("audit.allActions")}</SelectItem>
                  <SelectItem value="USER_CREATED">{trAction("USER_CREATED")}</SelectItem>
                  <SelectItem value="USER_UPDATED">{trAction("USER_UPDATED")}</SelectItem>
                  <SelectItem value="USER_DELETED">{trAction("USER_DELETED")}</SelectItem>
                  <SelectItem value="USER_SUSPENDED">{trAction("USER_SUSPENDED")}</SelectItem>
                  <SelectItem value="REGISTRATION_APPROVED">{trAction("REGISTRATION_APPROVED")}</SelectItem>
                  <SelectItem value="REGISTRATION_REJECTED">{trAction("REGISTRATION_REJECTED")}</SelectItem>
                  <SelectItem value="AD_CREATED">{trAction("AD_CREATED")}</SelectItem>
                  <SelectItem value="AD_UPDATED">{trAction("AD_UPDATED")}</SelectItem>
                  <SelectItem value="AD_DELETED">{trAction("AD_DELETED")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("audit.resource")}</label>
              <Select
                value={filters.resource === "" ? SELECT_ALL : filters.resource}
                onValueChange={(value) =>
                  setFilters({ ...filters, resource: value === SELECT_ALL ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("audit.allResources")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>{t("audit.allResources")}</SelectItem>
                  <SelectItem value="USER">{trResource("USER")}</SelectItem>
                  <SelectItem value="REGISTRATION_REQUEST">{trResource("REGISTRATION_REQUEST")}</SelectItem>
                  <SelectItem value="AD">{trResource("AD")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("common.status")}</label>
              <Select
                value={filters.status === "" ? SELECT_ALL : filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value === SELECT_ALL ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("users.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>{t("users.allStatuses")}</SelectItem>
                  <SelectItem value="SUCCESS">{trStatus("SUCCESS")}</SelectItem>
                  <SelectItem value="FAILURE">{trStatus("FAILURE")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("audit.startDate")}</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("audit.endDate")}</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("common.search")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("audit.searchPlaceholder")}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t("audit.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={log.status === "SUCCESS" ? "default" : "destructive"}>
                        {trStatus(log.status)}
                      </Badge>
                      <Badge variant="outline">{trAction(log.action)}</Badge>
                      <Badge variant="outline">{trResource(log.resource)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.userRole && t("audit.byRole", undefined, undefined, { role: log.userRole })}
                      {log.resourceId && ` • ID: ${log.resourceId}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.createdAt).toLocaleString(language === "ar" ? "ar-DZ" : "fr-DZ")}
                    </p>
                    {log.errorMessage && (
                      <p className="text-sm text-red-600 mt-2">{log.errorMessage}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
