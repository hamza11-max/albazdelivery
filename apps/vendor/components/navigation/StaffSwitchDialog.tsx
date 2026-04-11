"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Label } from "@/root/components/ui/label"
import { Input } from "@/root/components/ui/input"
import { Button } from "@/root/components/ui/button"

interface StaffSwitchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  translate: (fr: string, ar: string) => string
  onSubmit: (staffCode: string, pin: string) => Promise<{ ok: boolean; error?: string }>
}

export function StaffSwitchDialog({ open, onOpenChange, translate, onSubmit }: StaffSwitchDialogProps) {
  const [staffCode, setStaffCode] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")
    const result = await onSubmit(staffCode.trim(), pin.trim())
    setSubmitting(false)
    if (result.ok) {
      setStaffCode("")
      setPin("")
      onOpenChange(false)
      return
    }
    setError(result.error || translate("Code ou PIN invalide.", "رمز الموظف أو PIN غير صالح."))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("Changer de staff", "تبديل الموظف")}</DialogTitle>
          <DialogDescription>
            {translate("Entrez le code staff et le PIN.", "أدخل رمز الموظف وPIN.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{translate("Code staff", "رمز الموظف")}</Label>
            <Input value={staffCode} onChange={(e) => setStaffCode(e.target.value)} placeholder="1234" />
          </div>
          <div className="space-y-1">
            <Label>PIN</Label>
            <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="****" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {translate("Annuler", "إلغاء")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? translate("Vérification...", "جارٍ التحقق...") : translate("Changer", "تبديل")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
