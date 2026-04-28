"use client"

import { useState } from "react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@albaz/ui"
import { Download, FileJson, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"

type ExportKind = "users" | "orders" | "audit-logs"

export function ReportExportsPanel() {
  const { toast } = useToast()
  const [days, setDays] = useState("30")
  const [exportType, setExportType] = useState<ExportKind>("orders")
  const [busy, setBusy] = useState(false)
  const [jsonBusy, setJsonBusy] = useState(false)

  const rangeIso = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(days, 10))
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  }

  const exportCsv = async () => {
    setBusy(true)
    try {
      const { startDate, endDate } = rangeIso()
      const response = await fetchWithCsrf("/api/admin/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: exportType,
          format: "csv",
          filters: { startDate, endDate },
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || "Export refusé")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${exportType}_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({ title: "Export CSV prêt", description: "Le fichier a été téléchargé." })
    } catch (e) {
      toast({
        title: "Export impossible",
        description: e instanceof Error ? e.message : "Erreur inconnue",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const downloadAnalyticsJson = async () => {
    setJsonBusy(true)
    try {
      const { startDate, endDate } = rangeIso()
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy: "day",
      })
      const response = await fetch(`/api/admin/analytics?${params.toString()}`, {
        credentials: "include",
      })
      const data = await response.json()
      if (!data.success) {
        throw new Error("Réponse analytics invalide")
      }
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({ title: "Rapport JSON exporté", description: "Données agrégées téléchargées." })
    } catch (e) {
      toast({
        title: "Export JSON impossible",
        description: e instanceof Error ? e.message : "Erreur",
        variant: "destructive",
      })
    } finally {
      setJsonBusy(false)
    }
  }

  return (
    <Card id="reports-export">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Rapports & exports
        </CardTitle>
        <CardDescription>
          Choisissez une période puis exportez les jeux bruts (CSV/JSON API) ou l’agrégat analytique (JSON) — sans requête SQL manuelle.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="report-days">Période</Label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger id="report-days" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="report-dataset">Jeu export CSV</Label>
          <Select value={exportType} onValueChange={(v) => setExportType(v as ExportKind)}>
            <SelectTrigger id="report-dataset" className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orders">Commandes</SelectItem>
              <SelectItem value="users">Utilisateurs</SelectItem>
              <SelectItem value="audit-logs">Journal d’audit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => exportCsv()}>
          {busy ? "…" : <Download className="mr-2 h-4 w-4" />}
          CSV
        </Button>
        <Button type="button" variant="outline" disabled={jsonBusy} onClick={() => downloadAnalyticsJson()}>
          {jsonBusy ? "…" : <FileJson className="mr-2 h-4 w-4" />}
          JSON analytique
        </Button>
      </CardContent>
    </Card>
  )
}
