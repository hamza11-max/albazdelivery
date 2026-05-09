"use client"

import { useState, useEffect } from "react"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@albaz/ui"
import { Save, X, KeyRound } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"
import { useAdminI18n } from "../lib/AdminI18nProvider"

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
  const { t } = useAdminI18n()
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
      setResetError(t("editUser.err.minLen"))
      return
    }
    if (resetPw !== resetPwConfirm) {
      setResetError(t("editUser.err.mismatch"))
      return
    }
    await onResetPassword?.(resetPw)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editUser.title")}</DialogTitle>
          <DialogDescription>
            {user ? (
              <>{t("editUser.descWithEmail", undefined, undefined, { email: user.email || "" })}</>
            ) : (
              <>{t("editUser.descGeneric")}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t("common.name")}</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder={t("editUser.placeholder.fullName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">{t("common.email")}</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">{t("common.phone")}</Label>
            <Input
              id="edit-phone"
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
              placeholder="+213 XXX XX XX XX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">{t("common.role")}</Label>
            <Select
              value={form.role}
              onValueChange={(value: any) => onFormChange({ ...form, role: value })}
            >
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">{t("common.client")}</SelectItem>
                <SelectItem value="VENDOR">{t("common.vendor")}</SelectItem>
                <SelectItem value="DRIVER">{t("common.driver")}</SelectItem>
                <SelectItem value="ADMIN">{t("users.role.admin")}</SelectItem>
                {allowSuperAdminRole ? (
                  <SelectItem value="SUPER_ADMIN">{t("users.role.superAdmin")}</SelectItem>
                ) : null}
                <SelectItem value="SUPPORT">{t("users.role.support")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">{t("common.status")}</Label>
            <Select
              value={form.status}
              onValueChange={(value: any) => onFormChange({ ...form, status: value })}
            >
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">{t("common.pending")}</SelectItem>
                <SelectItem value="APPROVED">{t("common.approved")}</SelectItem>
                <SelectItem value="REJECTED">{t("common.rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">{t("common.address")}</Label>
            <Input
              id="edit-address"
              value={form.address}
              onChange={(e) => onFormChange({ ...form, address: e.target.value })}
              placeholder={t("editUser.placeholder.address")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-city">{t("common.city")}</Label>
            <Input
              id="edit-city"
              value={form.city}
              onChange={(e) => onFormChange({ ...form, city: e.target.value })}
              placeholder={t("editUser.placeholder.city")}
            />
          </div>

          {resetEnabled ? (
            <div className="space-y-3 rounded-lg border border-border p-3 pt-3">
              <p className="text-sm font-medium">{t("editUser.resetSection")}</p>
              <p className="text-xs text-muted-foreground">
                {t("editUser.resetHint")}
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
                  {t("editUser.generate")}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-pw">{t("editUser.newPassword")}</Label>
                <Input
                  id="reset-pw"
                  type="password"
                  autoComplete="new-password"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder={t("editUser.minChars")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-pw2">{t("editUser.confirm")}</Label>
                <Input
                  id="reset-pw2"
                  type="password"
                  autoComplete="new-password"
                  value={resetPwConfirm}
                  onChange={(e) => setResetPwConfirm(e.target.value)}
                  placeholder={t("editUser.repeatPassword")}
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
                {isResetting ? t("editUser.applying") : t("editUser.applyPassword")}
              </Button>
            </div>
          ) : onResetPassword && !canResetPassword ? (
            <p className="text-sm text-muted-foreground">
              {t("editUser.cannotResetOtherAdmin")}
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
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? t("editUser.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
