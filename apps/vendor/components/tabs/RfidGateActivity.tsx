"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Radio } from "lucide-react"
import type { RfidReadEvent, RfidReader } from "../../lib/electron-api"

const GATE_EVENTS_LIMIT = 20

interface RfidGateActivityProps {
  translate: (fr: string, ar: string) => string
  isElectron: boolean
  getRecentEvents: (limit?: number) => Promise<RfidReadEvent[]>
  getReaders: () => Promise<RfidReader[]>
}

export function RfidGateActivity({
  translate,
  isElectron,
  getRecentEvents,
  getReaders,
}: RfidGateActivityProps) {
  const [events, setEvents] = useState<RfidReadEvent[]>([])
  const [readers, setReaders] = useState<RfidReader[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!isElectron) return
    try {
      const [evList, rList] = await Promise.all([getRecentEvents(200), getReaders()])
      setEvents(evList)
      setReaders(rList)
    } catch (e) {
      console.warn("RFID gate activity load failed:", e)
    } finally {
      setLoading(false)
    }
  }, [isElectron, getRecentEvents, getReaders])

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [load])

  const readerName = (id: string) => readers.find((r) => r.id === id)?.name || id
  const defaultReader: RfidReader = {
    id: "keyboard-wedge",
    name: "Keyboard wedge",
    type: "keyboard",
    serialPath: null,
    baudRate: 9600,
    zoneId: null,
    lastSeenAt: null,
    status: "online",
  }
  const byReader =
    readers.length > 0
      ? readers.map((r) => ({
          reader: r,
          events: events.filter((e) => e.readerId === r.id).slice(0, GATE_EVENTS_LIMIT),
        }))
      : [{ reader: defaultReader, events: events.slice(0, GATE_EVENTS_LIMIT) }]

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
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {translate("Activité par lecteur / porte. Derniers scans par appareil.", "النشاط حسب القارئ / البوابة.")}
      </p>
      {loading && events.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{translate("Chargement...", "جاري التحميل...")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {byReader.map(({ reader, events: readerEvents }) => (
            <Card key={reader.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  {reader.name}
                  <Badge variant="secondary" className="font-normal text-xs">
                    {reader.type}
                  </Badge>
                  <span className="text-muted-foreground font-normal text-sm">
                    {readerEvents.length} {translate("lectures", "قراءة")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {readerEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{translate("Aucun scan récent.", "لا مسح حديث.")}</p>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto rounded border bg-muted/30 font-mono text-xs">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-muted/80">
                        <tr>
                          <th className="p-2 font-medium">{translate("Heure", "الوقت")}</th>
                          <th className="p-2 font-medium">{translate("Tag", "الوسم")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {readerEvents.map((ev) => (
                          <tr key={ev.id} className="border-t border-border/50">
                            <td className="p-2 text-muted-foreground whitespace-nowrap">
                              {new Date(ev.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-2 break-all">{ev.tagId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
