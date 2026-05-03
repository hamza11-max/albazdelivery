"use client"

import { useState, useEffect } from "react"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@albaz/ui"
import { Save, X, KeyRound } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"

function generateSecurePassword(): string {
  const chars =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%*"
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => chars[b % chars.length]).join("")
}

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserType | null
  form: {
    name: string
    email: string
    phone: string
    role: "CUSTOMER" | "VENDOR" | "DRIVER" | "ADMIN" | "SUPER_ADMIN" | "SUPPORT"
    status: "PENDING" | "APPROVED" | "REJECTED"
    address: string
    city: string
  }
  onFormChange: (form: EditUserDialogProps["form"]) => void
  onSave: () => void
  isSaving: boolean
  /** When false (e.g. another admin account), reset is blocked server-side — hide action. Defaults to true. */
  canResetPassword?: boolean
  onResetPassword?: (newPassword: string) => Promise<void>
  isResetting?: boolean
  /** Show “Super administrateur” in role list — only super admins should pass true. */
  allowSuperAdminRole?: boolean
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  form,
  onFormChange,
  onSave,
  isSaving,
  canResetPassword = true,
  onResetPassword,
  isResetting = false,
  allowSuperAdminRole = false,
}: EditUserDialogProps) {
  const [resetPw, setResetPw] = useState("")
  const [resetPwConfirm, setResetPwConfirm] = useState("")
  const [resetError, setResetError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setResetPw("")
      setResetPwConfirm("")
      setResetError(null)
    }
  }, [open])

  const resetEnabled = Boolean(onResetPassword) && canResetPassword

  const handleApplyPassword = async () => {
    setResetError(null)
    if (resetPw.length < 8) {
      setResetError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (resetPw !== resetPwConfirm) {
      setResetError("Les mots de passe ne correspondent pas.")
      return
    }
    await onResetPassword?.(resetPw)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          <DialogDescription>
            {user ? (
              <>Modifiez les informations de {user.email}</>
            ) : (
              <>Modifiez les informations de l&apos;utilisateur</>
            )}
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
                {allowSuperAdminRole ? (
                  <SelectItem value="SUPER_ADMIN">Super administrateur</SelectItem>
                ) : null}
                <SelectItem value="SUPPORT">Support</SelectItem>
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

          {resetEnabled ? (
            <div className="space-y-3 rounded-lg border border-border p-3 pt-3">
              <p className="text-sm font-medium">Réinitialiser le mot de passe</p>
              <p className="text-xs text-muted-foreground">
                Un e-mail peut être envoyé à l&apos;utilisateur après succès (selon configuration SMTP).
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  disabled={isResetting}
                  onClick={() => {
                    const pwd = generateSecurePassword()
                    setResetPw(pwd)
                    setResetPwConfirm(pwd)
                    setResetError(null)
                  }}
                >
                  Générer
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-pw">Nouveau mot de passe</Label>
                <Input
                  id="reset-pw"
                  type="password"
                  autoComplete="new-password"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder="Min. 8 caractères"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-pw2">Confirmer</Label>
                <Input
                  id="reset-pw2"
                  type="password"
                  autoComplete="new-password"
                  value={resetPwConfirm}
                  onChange={(e) => setResetPwConfirm(e.target.value)}
                  placeholder="Répéter le mot de passe"
                />
              </div>
              {resetError ? (
                <p className="text-sm text-destructive">{resetError}</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isResetting}
                onClick={() => void handleApplyPassword()}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                {isResetting ? "Application…" : "Appliquer le nouveau mot de passe"}
              </Button>
            </div>
          ) : onResetPassword && !canResetPassword ? (
            <p className="text-sm text-muted-foreground">
              Impossible de réinitialiser le mot de passe d&apos;un autre compte administrateur (super admin requis).
            </p>
          ) : null}
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

