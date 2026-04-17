"use client"

import { Card, CardContent } from "@/root/components/ui/card"
import { vendorMenuItems } from "./vendor-menu-items"
import { getVendorTabShortcut } from "./tab-shortcuts"

interface VendorMenuGridProps {
  allowedTabIds: string[]
  activeTab: string
  translate: (fr: string, ar: string) => string
  onSelectTab: (tabId: string) => void
}

export function VendorMenuGrid({ allowedTabIds, activeTab, translate, onSelectTab }: VendorMenuGridProps) {
  const items = vendorMenuItems.filter((item) => allowedTabIds.includes(item.id))
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{translate("Menu rapide", "القائمة السريعة")}</h2>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const shortcut = getVendorTabShortcut(item.id)
          return (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelectTab(item.id)}
            >
              <CardContent className="flex min-h-24 flex-col items-center justify-center gap-2 p-3 text-center sm:min-h-28 sm:p-4">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs font-medium sm:text-sm">{translate(item.labelFr, item.labelAr)}</span>
                {shortcut ? <span className="text-[10px] text-muted-foreground">{shortcut}</span> : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
