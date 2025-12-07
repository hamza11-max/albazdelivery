"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Textarea } from "@/root/components/ui/textarea"
import type { ChangeEvent } from "react"
import type { SupplierForm } from "../../app/vendor/types"

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierForm: SupplierForm
  onFormChange: (form: SupplierForm) => void
  onSave: () => void
  translate?: (fr: string, ar: string) => string
}

export function SupplierDialog({
  open,
  onOpenChange,
  supplierForm,
  onFormChange,
  onSave,
  translate = (fr: string) => fr,
}: SupplierDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("Ajouter un Fournisseur", "إضافة مورد")}</DialogTitle>
          <DialogDescription>
            {translate("Ajoutez un nouveau fournisseur pour gérer vos approvisionnements", "أضف مورداً جديداً لإدارة التوريدات الخاصة بك")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{translate("Nom de l'Entreprise", "اسم الشركة")}</Label>
            <Input
              value={supplierForm.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange({ ...supplierForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{translate("Personne de Contact", "الشخص المسؤول")}</Label>
            <Input
              value={supplierForm.contactPerson}
              onChange={(e) => onFormChange({ ...supplierForm, contactPerson: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{translate("Téléphone", "الهاتف")}</Label>
            <Input
              value={supplierForm.phone}
              onChange={(e) => onFormChange({ ...supplierForm, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{translate("Email (optionnel)", "البريد الإلكتروني (اختياري)")}</Label>
            <Input
              type="email"
              value={supplierForm.email}
              onChange={(e) => onFormChange({ ...supplierForm, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{translate("Adresse (optionnel)", "العنوان (اختياري)")}</Label>
            <Textarea
              value={supplierForm.address}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onFormChange({ ...supplierForm, address: e.target.value })}
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

