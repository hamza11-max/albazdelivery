"use client"

import { Card, CardContent } from "@/root/components/ui/card"
import { vendorMenuItems } from "./vendor-menu-items"

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelectTab(item.id)}
            >
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{translate(item.labelFr, item.labelAr)}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
