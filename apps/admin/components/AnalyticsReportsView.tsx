"use client"

import { LiveMetricsStrip } from "./LiveMetricsStrip"
import { ReportExportsPanel } from "./ReportExportsPanel"
import { AnalyticsDashboard } from "./AnalyticsDashboard"

export function AnalyticsReportsView() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Indicateurs directs
        </p>
        <LiveMetricsStrip />
      </div>
      <AnalyticsDashboard />
      <ReportExportsPanel />
    </div>
  )
}
