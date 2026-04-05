"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Button } from "@/root/components/ui/button"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { RfidAlert } from "../../lib/electron-api"

const ALERT_LABELS: Record<string, { fr: string; ar: string }> = {
  unknown_tag: { fr: "Tag inconnu", ar: "وسم غير معروف" },
  duplicate_read: { fr: "Lecture en double", ar: "قراءة مكررة" },
  zone_mismatch: { fr: "Zone incorrecte", ar: "منطقة غير صحيحة" },
  reader_offline: { fr: "Lecteur hors ligne", ar: "القارئ غير متصل" },
  low_read_rate: { fr: "Faible taux de lecture", ar: "انخفاض معدل القراءة" },
}

interface RfidAlertsTabProps {
  translate: (fr: string, ar: string) => string
  isElectron: boolean
  getAlerts: (opts?: { acknowledged?: boolean }) => Promise<RfidAlert[]>
  ackAlert: (alertId: string) => Promise<boolean>
  onTagClick?: (tagId: string) => void
}

export function RfidAlertsTab({
  translate,
  isElectron,
  getAlerts,
  ackAlert,
  onTagClick,
}: RfidAlertsTabProps) {
  const [alerts, setAlerts] = useState<RfidAlert[]>([])
  const [filter, setFilter] = useState<"all" | "unread">("unread")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!isElectron) return
    try {
      const list = await getAlerts(filter === "unread" ? { acknowledged: false } : undefined)
      setAlerts(Array.isArray(list) ? list : [])
    } catch (e) {
      console.warn("RFID alerts load failed:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [isElectron, filter])

  const handleAck = async (id: string) => {
    try {
      await ackAlert(id)
      await load()
    } catch (e) {
      console.warn("Ack alert failed:", e)
    }
  }

  if (!isElectron) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">{translate("RFID disponible en mode bureau.", "RFID متاح في تطبيق سطح المكتب.")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {translate("Alertes et exceptions", "التنبيهات والاستثناءات")}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            {translate("Non lues", "غير مقروءة")}
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            {translate("Toutes", "الكل")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{translate("Chargement...", "جاري التحميل...")}</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {filter === "unread"
              ? translate("Aucune alerte non lue.", "لا توجد تنبيهات غير مقروءة.")
              : translate("Aucune alerte.", "لا توجد تنبيهات.")}
          </p>
        ) : (
          <ul className="space-y-2 max-h-[400px] overflow-y-auto">
            {alerts.map((a) => {
              const labels = ALERT_LABELS[a.type] || { fr: a.type, ar: a.type }
              const label = translate(labels.fr, labels.ar)
              return (
                <li
                  key={a.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${!a.acknowledged ? "bg-muted/50" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertCircle className={`w-4 h-4 shrink-0 ${a.acknowledged ? "text-muted-foreground" : "text-amber-500"}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{label}</p>
                      <button
                        type="button"
                        onClick={() => onTagClick?.(a.tagId)}
                        className="text-xs text-muted-foreground hover:text-foreground font-mono truncate block text-left"
                      >
                        {a.tagId}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()} · {a.readerId}
                      </p>
                    </div>
                    {!a.acknowledged && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {translate("Nouveau", "جديد")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!a.acknowledged && (
                      <Button variant="ghost" size="sm" onClick={() => handleAck(a.id)} title={translate("Marquer comme lu", "تعليم كمقروء")}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
