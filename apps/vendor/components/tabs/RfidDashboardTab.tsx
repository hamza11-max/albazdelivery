"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import { Radio, LayoutDashboard, Settings, DoorOpen, AlertCircle } from "lucide-react"
import { RfidLiveFeed } from "./RfidLiveFeed"
import { RfidDeviceManagement } from "./RfidDeviceManagement"
import { RfidGateActivity } from "./RfidGateActivity"
import { RfidAlertsTab } from "./RfidAlertsTab"
import { RfidItemDetailDialog } from "../dialogs/RfidItemDetailDialog"
import type { RfidReadEvent, RfidReader } from "../../lib/electron-api"

interface RfidDashboardTabProps {
  translate: (fr: string, ar: string) => string
  isElectronRuntime: boolean
  onLinkProduct?: (tagId: string) => void
}

export function RfidDashboardTab({ translate, isElectronRuntime, onLinkProduct }: RfidDashboardTabProps) {
  const [events, setEvents] = useState<RfidReadEvent[]>([])
  const [readers, setReaders] = useState<RfidReader[]>([])
  const [alertsCount, setAlertsCount] = useState(0)
  const [readerFilter, setReaderFilter] = useState<string | null>(null)
  const [detailTagId, setDetailTagId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const api = typeof window !== "undefined" ? (window as any).electronAPI?.rfid : null

  const openTagDetail = (tagId: string) => {
    setDetailTagId(tagId)
    setDetailOpen(true)
  }

  const readerNameById = useCallback(
    (id: string) => readers.find((r) => r.id === id)?.name || id,
    [readers]
  )

  const loadSummary = useCallback(async () => {
    if (!api || !isElectronRuntime) return
    try {
      const [evList, rList, alertList] = await Promise.all([
        api.getRecentEvents(100),
        api.getReaders(),
        api.getAlerts({ acknowledged: false }),
      ])
      setEvents(evList)
      setReaders(rList)
      setAlertsCount(Array.isArray(alertList) ? alertList.length : 0)
    } catch (e) {
      console.warn("RFID summary load failed:", e)
    }
  }, [api, isElectronRuntime])

  useEffect(() => {
    loadSummary()
    const interval = setInterval(loadSummary, 4000)
    return () => clearInterval(interval)
  }, [loadSummary])

  const lastMinute = events.filter(
    (e) => Date.now() - new Date(e.timestamp).getTime() < 60_000
  ).length
  const uniqueTags = new Set(events.slice(0, 100).map((e) => e.tagId)).size

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="w-7 h-7 text-teal-500" />
          {translate("RFID", "RFID")}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {translate("Tableau de bord des scans et lecteurs RFID.", "لوحة تحكم مسح RFID والأجهزة.")}
        </p>
      </div>

      {isElectronRuntime && api && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Scans (1 min)", "المسح (دقيقة)")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{lastMinute}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Tags uniques (100 derniers)", "وسوم فريدة")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{uniqueTags}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {translate("Alertes non lues", "تنبيهات غير مقروءة")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {alertsCount}
                  {alertsCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {translate("Nouveau", "جديد")}
                    </Badge>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                {translate("Tableau de bord", "لوحة التحكم")}
              </TabsTrigger>
              <TabsTrigger value="gates" className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4" />
                {translate("Portes", "البوابات")}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {translate("Alertes", "التنبيهات")}
                {alertsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                    {alertsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="devices" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {translate("Appareils", "الأجهزة")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">{translate("Lecteur:", "القارئ:")}</span>
                <select
                  className="rounded border bg-background px-2 py-1 text-sm"
                  value={readerFilter ?? ""}
                  onChange={(e) => setReaderFilter(e.target.value || null)}
                >
                  <option value="">{translate("Tous", "الكل")}</option>
                  {readers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <RfidLiveFeed
                translate={translate}
                isElectron={isElectronRuntime}
                readerFilter={readerFilter}
                getRecentEvents={api.getRecentEvents.bind(api)}
                onEventsBatch={api.onEventsBatch?.bind(api)}
                readerNameById={readerNameById}
                onTagClick={openTagDetail}
              />
            </TabsContent>
            <TabsContent value="gates">
              <RfidGateActivity
                translate={translate}
                isElectron={isElectronRuntime}
                getRecentEvents={api.getRecentEvents.bind(api)}
                getReaders={api.getReaders.bind(api)}
              />
            </TabsContent>
            <TabsContent value="alerts">
              <RfidAlertsTab
                translate={translate}
                isElectron={isElectronRuntime}
                getAlerts={api.getAlerts.bind(api)}
                ackAlert={api.ackAlert.bind(api)}
                onTagClick={openTagDetail}
              />
            </TabsContent>
            <TabsContent value="devices">
              <RfidDeviceManagement
                translate={translate}
                isElectron={isElectronRuntime}
                getReaders={api.getReaders.bind(api)}
                addReader={api.addReader.bind(api)}
                deleteReader={api.deleteReader.bind(api)}
                listPorts={api.listPorts.bind(api)}
                connectSerial={api.connectSerial.bind(api)}
              />
            </TabsContent>
          </Tabs>

          <RfidItemDetailDialog
            open={detailOpen}
            onOpenChange={setDetailOpen}
            tagId={detailTagId}
            translate={translate}
            isElectron={isElectronRuntime}
            getEventsByTag={api.getEventsByTag.bind(api)}
            getReaders={api.getReaders.bind(api)}
            onLinkProduct={onLinkProduct}
          />
        </>
      )}

      {(!isElectronRuntime || !api) && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {translate(
                "Le tableau de bord RFID est disponible dans l'application de bureau AlBaz Vendor (Electron). Ouvrez l'app sur ce poste pour voir les scans en direct et gérer les lecteurs.",
                "لوحة تحكم RFID متاحة في تطبيق سطح المكتب AlBaz Vendor. افتح التطبيق على هذا الجهاز لرؤية المسح وإدارة الأجهزة."
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
