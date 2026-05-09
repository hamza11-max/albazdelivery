"use client"

import { useState } from "react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@albaz/ui"
import { Download, FileJson, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"
import { useAdminI18n } from "../lib/AdminI18nProvider"

type ExportKind = "users" | "orders" | "audit-logs"

export function ReportExportsPanel() {
  const { toast } = useToast()
  const { t } = useAdminI18n()
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
        throw new Error((err as { error?: string }).error || t("report.exportRejected"))
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

      toast({ title: t("report.csvReady"), description: t("report.fileDownloaded") })
    } catch (e) {
      toast({
        title: t("report.exportFailed"),
        description: e instanceof Error ? e.message : t("report.unknownError"),
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
        throw new Error(t("report.analyticsInvalid"))
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

      toast({ title: t("report.jsonReady"), description: t("report.jsonDownloaded") })
    } catch (e) {
      toast({
        title: t("report.jsonFailed"),
        description: e instanceof Error ? e.message : t("common.error"),
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
          {t("report.title")}
        </CardTitle>
        <CardDescription>
          {t("report.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="report-days">{t("report.period")}</Label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger id="report-days" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("report.days7")}</SelectItem>
              <SelectItem value="30">{t("report.days30")}</SelectItem>
              <SelectItem value="90">{t("report.days90")}</SelectItem>
              <SelectItem value="365">{t("report.year")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="report-dataset">{t("report.csvDataset")}</Label>
          <Select value={exportType} onValueChange={(v) => setExportType(v as ExportKind)}>
            <SelectTrigger id="report-dataset" className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orders">{t("report.datasetOrders")}</SelectItem>
              <SelectItem value="users">{t("report.datasetUsers")}</SelectItem>
              <SelectItem value="audit-logs">{t("report.datasetAudit")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => exportCsv()}>
          {busy ? "…" : <Download className="mr-2 h-4 w-4" />}
          CSV
        </Button>
        <Button type="button" variant="outline" disabled={jsonBusy} onClick={() => downloadAnalyticsJson()}>
          {jsonBusy ? "…" : <FileJson className="mr-2 h-4 w-4" />}
          {t("report.jsonAnalytics")}
        </Button>
      </CardContent>
    </Card>
  )
}
