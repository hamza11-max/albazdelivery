"use client"

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Badge } from "@albaz/ui"
import { Trash2, X } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"
import { useAdminI18n } from "../lib/AdminI18nProvider"

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserType | null
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isDeleting,
}: DeleteUserDialogProps) {
  const { t } = useAdminI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("deleteUser.title")}</DialogTitle>
          <DialogDescription>
            {t("deleteUser.desc")}
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">{user.phone}</p>
            <Badge variant="outline">{user.role}</Badge>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            <X className="w-4 h-4 mr-2" />
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? t("deleteUser.deleting") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

