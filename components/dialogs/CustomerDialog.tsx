"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import type { ChangeEvent } from "react"
import type { CustomerForm } from "../../app/vendor/types"

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerForm: CustomerForm
  onFormChange: (form: CustomerForm) => void
  onSave: () => void
  translate?: (fr: string, ar: string) => string
}

export function CustomerDialog({
  open,
  onOpenChange,
  customerForm,
  onFormChange,
  onSave,
  translate = (fr: string) => fr,
}: CustomerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("Ajouter un Client", "إضافة عميل")}</DialogTitle>
          <DialogDescription>
            {translate("Ajoutez un nouveau client à votre base de données", "أضف عميلاً جديداً إلى قاعدة البيانات الخاصة بك")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{translate("Nom", "الاسم")}</Label>
            <Input
              value={customerForm.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange({ ...customerForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{translate("Téléphone", "الهاتف")}</Label>
            <Input
              value={customerForm.phone}
              onChange={(e) => onFormChange({ ...customerForm, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{translate("Email (optionnel)", "البريد الإلكتروني (اختياري)")}</Label>
            <Input
              type="email"
              value={customerForm.email}
              onChange={(e) => onFormChange({ ...customerForm, email: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {translate("Annuler", "إلغاء")}
          </Button>
          <Button onClick={onSave}>{translate("Enregistrer", "حفظ")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

