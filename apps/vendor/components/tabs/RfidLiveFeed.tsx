"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import type { RfidReadEvent } from "../../lib/electron-api"

const POLL_MS = 2000
const MAX_VISIBLE = 100

interface RfidLiveFeedProps {
  translate: (fr: string, ar: string) => string
  isElectron: boolean
  readerFilter: string | null
  getRecentEvents: (limit?: number) => Promise<RfidReadEvent[]>
  onEventsBatch?: (callback: (events: RfidReadEvent[]) => void) => void
  readerNameById: (id: string) => string
  onTagClick?: (tagId: string) => void
}

export function RfidLiveFeed({
  translate,
  isElectron,
  readerFilter,
  getRecentEvents,
  onEventsBatch,
  readerNameById,
  onTagClick,
}: RfidLiveFeedProps) {
  const [events, setEvents] = useState<RfidReadEvent[]>([])
  const [loading, setLoading] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)

  const fetchEvents = async () => {
    if (!isElectron) return
    try {
      const list = await getRecentEvents(MAX_VISIBLE)
      setEvents(list)
    } catch (e) {
      console.warn("RFID getRecentEvents failed:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isElectron) {
      setLoading(false)
      return
    }
    fetchEvents()
    const interval = setInterval(fetchEvents, POLL_MS)
    return () => clearInterval(interval)
  }, [isElectron])

  useEffect(() => {
    if (!isElectron || !onEventsBatch) return
    const handler = (batch: RfidReadEvent[]) => {
      setEvents((prev) => {
        const next = [...batch, ...prev].slice(0, MAX_VISIBLE)
        return next
      })
    }
    onEventsBatch(handler)
  }, [isElectron, onEventsBatch])

  const filtered = readerFilter
    ? events.filter((e) => e.readerId === readerFilter)
    : events

  if (!isElectron) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">
            {translate("RFID est disponible dans l'application de bureau (Electron).", "RFID متاح في تطبيق سطح المكتب فقط.")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {translate("Flux en direct", "البث المباشر")}
          <Badge variant="secondary" className="font-normal">
            {filtered.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{translate("Chargement...", "جاري التحميل...")}</p>
        ) : (
          <div
            ref={listRef}
            className="h-[320px] overflow-y-auto rounded border bg-muted/30 font-mono text-sm"
          >
            {filtered.length === 0 ? (
              <div className="p-4 text-muted-foreground">
                {translate("Aucun scan RFID récent. Scannez un tag (préfixe RFID: + ID).", "لا مسح RFID حديث. امسح وسماً (بادئة RFID: + المعرف).")}
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    <th className="p-2 font-medium">{translate("Heure", "الوقت")}</th>
                    <th className="p-2 font-medium">{translate("Tag", "الوسم")}</th>
                    <th className="p-2 font-medium">{translate("Lecteur", "القارئ")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ev) => (
                    <tr key={ev.id} className="border-t border-border/50">
                      <td className="p-2 text-muted-foreground whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2 break-all">
                        {onTagClick ? (
                          <button
                            type="button"
                            onClick={() => onTagClick(ev.tagId)}
                            className="text-left hover:underline text-primary font-mono"
                          >
                            {ev.tagId}
                          </button>
                        ) : (
                          ev.tagId
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {readerNameById(ev.readerId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
