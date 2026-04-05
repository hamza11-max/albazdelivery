"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"
import { Badge } from "@/root/components/ui/badge"
import { Link2, Package } from "lucide-react"
import type { RfidReadEvent } from "../../lib/electron-api"

interface RfidItemDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tagId: string | null
  translate: (fr: string, ar: string) => string
  isElectron: boolean
  getEventsByTag: (tagId: string, limit?: number) => Promise<RfidReadEvent[]>
  getReaders: () => Promise<Array<{ id: string; name: string }>>
  onLinkProduct?: (tagId: string) => void
}

export function RfidItemDetailDialog({
  open,
  onOpenChange,
  tagId,
  translate,
  isElectron,
  getEventsByTag,
  getReaders,
  onLinkProduct,
}: RfidItemDetailDialogProps) {
  const [events, setEvents] = useState<RfidReadEvent[]>([])
  const [readers, setReaders] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [linkedProduct, setLinkedProduct] = useState<{ name: string } | null>(null)

  const readerName = (id: string) => readers.find((r) => r.id === id)?.name || id

  useEffect(() => {
    if (!open || !tagId || !isElectron) return
    setLoading(true)
    Promise.all([getEventsByTag(tagId, 50), getReaders()])
      .then(([evList, rList]) => {
        setEvents(Array.isArray(evList) ? evList : [])
        setReaders(rList || [])
      })
      .catch((e) => console.warn("RfidItemDetail load failed:", e))
      .finally(() => setLoading(false))
  }, [open, tagId, isElectron, getEventsByTag, getReaders])

  useEffect(() => {
    if (!open || !tagId || !isElectron) return
    const api = (window as any).electronAPI
    if (api?.offline?.getProductByRfidTag) {
      api.offline.getProductByRfidTag(tagId).then((p: { name?: string } | null) => {
        setLinkedProduct(p ? { name: p.name || "" } : null)
      }).catch(() => setLinkedProduct(null))
    } else {
      setLinkedProduct(null)
    }
  }, [open, tagId, isElectron])

  if (!tagId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-base">
            {translate("Détail du tag", "تفاصيل الوسم")}: {tagId}
          </DialogTitle>
          <DialogDescription>
            {translate("Historique des lectures et produit associé.", "سجل القراءات والمنتج المرتبط.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {linkedProduct !== undefined && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <span className="text-sm text-muted-foreground">{translate("Produit lié", "المنتج المرتبط")}:</span>
              {linkedProduct ? (
                <span className="font-medium flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {linkedProduct.name}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">{translate("Aucun", "لا يوجد")}</span>
                  {onLinkProduct && (
                    <Button size="sm" variant="outline" onClick={() => onLinkProduct(tagId)}>
                      <Link2 className="w-4 h-4 mr-1" />
                      {translate("Lier un produit", "ربط منتج")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">{translate("Historique des lectures", "سجل القراءات")}</h4>
            {loading ? (
              <p className="text-sm text-muted-foreground">{translate("Chargement...", "جاري التحميل...")}</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{translate("Aucune lecture pour ce tag.", "لا توجد قراءات لهذا الوسم.")}</p>
            ) : (
              <div className="rounded border bg-muted/30 font-mono text-xs max-h-[240px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr>
                      <th className="p-2 font-medium">{translate("Heure", "الوقت")}</th>
                      <th className="p-2 font-medium">{translate("Lecteur", "القارئ")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id} className="border-t border-border/50">
                        <td className="p-2 text-muted-foreground whitespace-nowrap">
                          {new Date(ev.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2">{readerName(ev.readerId)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
