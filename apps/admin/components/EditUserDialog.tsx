"use client"

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@albaz/ui"
import { Save, X } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserType | null
  form: {
    name: string
    email: string
    phone: string
    role: "CUSTOMER" | "VENDOR" | "DRIVER" | "ADMIN"
    status: "PENDING" | "APPROVED" | "REJECTED"
    address: string
    city: string
  }
  onFormChange: (form: EditUserDialogProps["form"]) => void
  onSave: () => void
  isSaving: boolean
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  form,
  onFormChange,
  onSave,
  isSaving,
}: EditUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="Nom complet"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Téléphone</Label>
            <Input
              id="edit-phone"
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
              placeholder="+213 XXX XX XX XX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Rôle</Label>
            <Select
              value={form.role}
              onValueChange={(value: any) => onFormChange({ ...form, role: value })}
            >
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Client</SelectItem>
                <SelectItem value="VENDOR">Vendeur</SelectItem>
                <SelectItem value="DRIVER">Livreur</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Statut</Label>
            <Select
              value={form.status}
              onValueChange={(value: any) => onFormChange({ ...form, status: value })}
            >
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="APPROVED">Approuvé</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Adresse</Label>
            <Input
              id="edit-address"
              value={form.address}
              onChange={(e) => onFormChange({ ...form, address: e.target.value })}
              placeholder="Adresse complète"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-city">Ville</Label>
            <Input
              id="edit-city"
              value={form.city}
              onChange={(e) => onFormChange({ ...form, city: e.target.value })}
              placeholder="Ville"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

