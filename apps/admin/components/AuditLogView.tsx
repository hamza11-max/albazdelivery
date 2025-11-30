"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@albaz/ui"
import { Search, Filter, Calendar, Download } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"

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
        credentials: 'include',
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
    ? logs.filter((log) =>
        log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.resource.toLowerCase().includes(filters.search.toLowerCase()) ||
        (log.userRole && log.userRole.toLowerCase().includes(filters.search.toLowerCase()))
      )
    : logs

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Journal d'audit</h2>
        <Button 
          variant="outline"
          onClick={async () => {
            try {
              const response = await fetchWithCsrf('/api/admin/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'audit-logs',
                  format: 'csv',
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
                const a = document.createElement('a')
                a.href = url
                a.download = `audit-logs_${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toast({
                  title: "Succès",
                  description: "Export réussi",
                })
              } else {
                throw new Error('Export failed')
              }
            } catch (error) {
              toast({
                title: "Erreur",
                description: "Impossible d'exporter les logs",
                variant: "destructive",
              })
            }
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les actions</SelectItem>
                  <SelectItem value="USER_CREATED">Création d'utilisateur</SelectItem>
                  <SelectItem value="USER_UPDATED">Modification d'utilisateur</SelectItem>
                  <SelectItem value="USER_DELETED">Suppression d'utilisateur</SelectItem>
                  <SelectItem value="USER_SUSPENDED">Suspension d'utilisateur</SelectItem>
                  <SelectItem value="REGISTRATION_APPROVED">Approbation d'inscription</SelectItem>
                  <SelectItem value="REGISTRATION_REJECTED">Rejet d'inscription</SelectItem>
                  <SelectItem value="AD_CREATED">Création de publicité</SelectItem>
                  <SelectItem value="AD_UPDATED">Modification de publicité</SelectItem>
                  <SelectItem value="AD_DELETED">Suppression de publicité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ressource</label>
              <Select value={filters.resource} onValueChange={(value) => setFilters({ ...filters, resource: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les ressources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les ressources</SelectItem>
                  <SelectItem value="USER">Utilisateur</SelectItem>
                  <SelectItem value="REGISTRATION_REQUEST">Demande d'inscription</SelectItem>
                  <SelectItem value="AD">Publicité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="SUCCESS">Succès</SelectItem>
                  <SelectItem value="FAILURE">Échec</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date de début</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date de fin</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucun log d'audit trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={log.status === "SUCCESS" ? "default" : "destructive"}>
                        {log.status}
                      </Badge>
                      <Badge variant="outline">{log.action}</Badge>
                      <Badge variant="outline">{log.resource}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.userRole && `Par ${log.userRole}`}
                      {log.resourceId && ` • ID: ${log.resourceId}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.createdAt).toLocaleString("fr-DZ")}
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

