"use client"

import { LiveMetricsStrip } from "./LiveMetricsStrip"
import { ReportExportsPanel } from "./ReportExportsPanel"
import { AnalyticsDashboard } from "./AnalyticsDashboard"
import { AdminOpsMetricsCard } from "./AdminOpsMetricsCard"
import { AdminAdvancedAnalyticsPanel } from "./AdminAdvancedAnalyticsPanel"
import { useAdminI18n } from "../lib/AdminI18nProvider"

export function AnalyticsReportsView() {
  const { t } = useAdminI18n()
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("analytics.directIndicators")}
        </p>
        <LiveMetricsStrip />
      </div>
      <AdminOpsMetricsCard />
      <AnalyticsDashboard />
      <AdminAdvancedAnalyticsPanel />
      <ReportExportsPanel />
    </div>
  )
}
