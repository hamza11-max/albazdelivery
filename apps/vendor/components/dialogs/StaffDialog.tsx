"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/root/components/ui/select"
import { X } from "lucide-react"

export interface StaffMember {
  id?: string
  name: string
  email: string
  role: string
  password: string
}

interface StaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: StaffMember | null
  translate: (fr: string, ar: string) => string
  onSave: (staff: StaffMember) => void
}

export function StaffDialog({
  open,
  onOpenChange,
  staff,
  translate,
  onSave,
}: StaffDialogProps) {
  const [formData, setFormData] = useState<StaffMember>({
    name: "",
    email: "",
    role: "cashier",
    password: "",
  })

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || "",
        email: staff.email || "",
        role: staff.role || "cashier",
        password: "", // Don't pre-fill password
      })
    } else {
      setFormData({
        name: "",
        email: "",
        role: "cashier",
        password: "",
      })
    }
  }, [staff, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.role || (!staff && !formData.password)) {
      return
    }
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {staff ? translate("Modifier le personnel", "تعديل الموظف") : translate("Ajouter du personnel", "إضافة موظف")}
          </DialogTitle>
          <DialogDescription>
            {staff
              ? translate("Modifiez les informations du membre du personnel", "قم بتعديل معلومات الموظف")
              : translate("Ajoutez un nouveau membre du personnel avec un rôle et un mot de passe", "أضف موظفاً جديداً مع دور وكلمة مرور")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">{translate("Nom complet", "الاسم الكامل")}</Label>
              <Input
                id="staff-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={translate("Nom du personnel", "اسم الموظف")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">{translate("Email", "البريد الإلكتروني")}</Label>
              <Input
                id="staff-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">{translate("Rôle", "الدور")}</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="staff-role">
                  <SelectValue placeholder={translate("Sélectionner un rôle", "اختر دوراً")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">{translate("Propriétaire", "المالك")}</SelectItem>
                  <SelectItem value="manager">{translate("Gestionnaire", "المدير")}</SelectItem>
                  <SelectItem value="cashier">{translate("Caissier", "أمين الصندوق")}</SelectItem>
                  <SelectItem value="staff">{translate("Personnel", "موظف")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password">
                {translate("Mot de passe", "كلمة المرور")} {staff && `(${translate("Laisser vide pour ne pas changer", "اتركه فارغاً لعدم التغيير")})`}
              </Label>
              <Input
                id="staff-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={translate("Mot de passe", "كلمة المرور")}
                required={!staff}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {translate("Annuler", "إلغاء")}
            </Button>
            <Button type="submit">
              {staff ? translate("Enregistrer", "حفظ") : translate("Ajouter", "إضافة")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

