"use client"

import { useState, useEffect } from "react"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Switch } from "@/root/components/ui/switch"

interface DayHoursInputProps {
  dayKey: string
  dayLabel: { fr: string; ar: string }
  isWeekend: boolean
  translate: (fr: string, ar: string) => string
}

export function DayHoursInput({ dayKey, dayLabel, isWeekend, translate }: DayHoursInputProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`vendor-hours-${dayKey}`)
      return stored ? JSON.parse(stored).isOpen : !isWeekend
    }
    return !isWeekend
  })
  const [openingHour, setOpeningHour] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`vendor-hours-${dayKey}`)
      return stored ? JSON.parse(stored).opening : '09:00'
    }
    return '09:00'
  })
  const [closingHour, setClosingHour] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`vendor-hours-${dayKey}`)
      return stored ? JSON.parse(stored).closing : '18:00'
    }
    return '18:00'
  })

  const handleToggle = (open: boolean) => {
    setIsOpen(open)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`vendor-hours-${dayKey}`, JSON.stringify({
        isOpen: open,
        opening: openingHour,
        closing: closingHour
      }))
    }
  }

  const handleOpeningChange = (hour: string) => {
    setOpeningHour(hour)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`vendor-hours-${dayKey}`, JSON.stringify({
        isOpen,
        opening: hour,
        closing: closingHour
      }))
    }
  }

  const handleClosingChange = (hour: string) => {
    setClosingHour(hour)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`vendor-hours-${dayKey}`, JSON.stringify({
        isOpen,
        opening: openingHour,
        closing: hour
      }))
    }
  }

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Switch
            checked={isOpen}
            onCheckedChange={handleToggle}
          />
          <Label className="font-medium min-w-[100px]">
            {translate(dayLabel.fr, dayLabel.ar)}
            {isWeekend && <span className="text-xs text-muted-foreground ml-2">({translate("Weekend", "عطلة نهاية الأسبوع")})</span>}
          </Label>
        </div>
      </div>
      {isOpen && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm">{translate("Ouverture", "الفتح")}</Label>
            <Input
              type="time"
              value={openingHour}
              onChange={(e) => handleOpeningChange(e.target.value)}
              className="w-32"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-2">
            <Label className="text-sm">{translate("Fermeture", "الإغلاق")}</Label>
            <Input
              type="time"
              value={closingHour}
              onChange={(e) => handleClosingChange(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      )}
      {!isOpen && (
        <span className="text-sm text-muted-foreground">
          {translate("Fermé", "مغلق")}
        </span>
      )}
    </div>
  )
}

