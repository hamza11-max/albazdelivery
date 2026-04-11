"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"

export interface VendorNotificationItem {
  id: string
  title: string
  description: string
  createdAt: number
  read?: boolean
}

interface NotificationsPanelProps {
  open: boolean
  notifications: VendorNotificationItem[]
  translate: (fr: string, ar: string) => string
  onOpenChange: (open: boolean) => void
  onMarkAllRead: () => void
}

export function NotificationsPanel({
  open,
  notifications,
  translate,
  onOpenChange,
  onMarkAllRead,
}: NotificationsPanelProps) {
  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{translate("Notifications", "الإشعارات")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onMarkAllRead}>
              {translate("Tout marquer comme lu", "تعليم الكل كمقروء")}
            </Button>
          </div>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {translate("Aucune notification.", "لا توجد إشعارات.")}
            </p>
          ) : (
            <div className="max-h-[360px] space-y-2 overflow-y-auto">
              {sorted.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 ${item.read ? "opacity-70" : "bg-primary/5"}`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
