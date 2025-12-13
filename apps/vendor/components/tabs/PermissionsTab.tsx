"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Label } from "@/root/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/root/components/ui/select"
import { Shield, Edit, Save, X } from "lucide-react"
import {
  DEFAULT_ROLE_PERMISSIONS,
  getRolePermissions,
  getStaffPermissions,
  saveStaffPermissions,
  type Permission,
  type Role,
  type StaffMember,
} from "../../utils/permissionsUtils"
import { useToast } from "@/root/hooks/use-toast"

interface PermissionsTabProps {
  translate: (fr: string, ar: string) => string
}

const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
  pos: {
    label: "Point de Vente",
    permissions: ["pos.view", "pos.create", "pos.edit", "pos.delete"],
  },
  inventory: {
    label: "Inventaire",
    permissions: ["inventory.view", "inventory.create", "inventory.edit", "inventory.delete"],
  },
  sales: {
    label: "Ventes",
    permissions: ["sales.view", "sales.create", "sales.edit", "sales.delete"],
  },
  orders: {
    label: "Commandes",
    permissions: ["orders.view", "orders.edit", "orders.delete"],
  },
  customers: {
    label: "Clients",
    permissions: ["customers.view", "customers.create", "customers.edit", "customers.delete"],
  },
  staff: {
    label: "Personnel",
    permissions: ["staff.view", "staff.create", "staff.edit", "staff.delete"],
  },
  reports: {
    label: "Rapports",
    permissions: ["reports.view"],
  },
  settings: {
    label: "Paramètres",
    permissions: ["settings.view", "settings.edit"],
  },
  coupons: {
    label: "Coupons",
    permissions: ["coupons.view", "coupons.create", "coupons.edit", "coupons.delete"],
  },
  backup: {
    label: "Sauvegarde",
    permissions: ["backup.view", "backup.create", "backup.restore"],
  },
}

export function PermissionsTab({ translate }: PermissionsTabProps) {
  const { toast } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('vendor-staff') || '[]')
    }
    return []
  })
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([])
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vendor-staff')
      if (stored) {
        setStaff(JSON.parse(stored))
      }
    }
  }, [])

  const handleEditPermissions = (staffMember: StaffMember) => {
    setEditingStaff(staffMember)
    const currentPerms = getStaffPermissions(staffMember)
    setCustomPermissions(currentPerms)
    setShowPermissionsDialog(true)
  }

  const handleSavePermissions = () => {
    if (!editingStaff) return

    saveStaffPermissions(editingStaff.id, customPermissions)
    
    const updated = staff.map((s) => {
      if (s.id === editingStaff.id) {
        return { ...s, permissions: customPermissions }
      }
      return s
    })
    setStaff(updated)
    localStorage.setItem('vendor-staff', JSON.stringify(updated))

    toast({
      title: translate("Permissions mises à jour", "تم تحديث الصلاحيات"),
      description: translate("Les permissions ont été enregistrées avec succès", "تم حفظ الصلاحيات بنجاح"),
    })

    setShowPermissionsDialog(false)
    setEditingStaff(null)
  }

  const handleTogglePermission = (permission: Permission) => {
    if (customPermissions.includes(permission)) {
      setCustomPermissions(customPermissions.filter((p) => p !== permission))
    } else {
      setCustomPermissions([...customPermissions, permission])
    }
  }

  const handleResetToRole = () => {
    if (!editingStaff) return
    const rolePerms = getRolePermissions(editingStaff.role)
    setCustomPermissions(rolePerms)
  }

  const getPermissionLabel = (permission: Permission): string => {
    const [category, action] = permission.split('.')
    const actionLabels: Record<string, string> = {
      view: translate("Voir", "عرض"),
      create: translate("Créer", "إنشاء"),
      edit: translate("Modifier", "تعديل"),
      delete: translate("Supprimer", "حذف"),
      restore: translate("Restaurer", "استعادة"),
    }
    return actionLabels[action] || action
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Gestion des Permissions", "إدارة الصلاحيات")}</h2>

      {/* Roles Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {translate("Rôles et Permissions", "الأدوار والصلاحيات")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(DEFAULT_ROLE_PERMISSIONS).map((rolePerm) => (
              <div key={rolePerm.role} className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-1">{rolePerm.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{rolePerm.description}</p>
                <Badge variant="secondary">{rolePerm.permissions.length} {translate("permissions", "صلاحيات")}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>{translate("Permissions du Personnel", "صلاحيات الموظفين")}</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {translate("Aucun membre du personnel", "لا يوجد موظفين")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Nom", "الاسم")}</TableHead>
                  <TableHead>{translate("Rôle", "الدور")}</TableHead>
                  <TableHead>{translate("Permissions", "الصلاحيات")}</TableHead>
                  <TableHead className="text-right">{translate("Actions", "الإجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => {
                  const perms = getStaffPermissions(member)
                  const isCustom = member.permissions && member.permissions.length > 0
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <Badge>{DEFAULT_ROLE_PERMISSIONS[member.role]?.name || member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{perms.length} {translate("permissions", "صلاحيات")}</span>
                          {isCustom && (
                            <Badge variant="outline" className="text-xs">
                              {translate("Personnalisé", "مخصص")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPermissions(member)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {translate("Modifier", "تعديل")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {translate("Modifier les Permissions", "تعديل الصلاحيات")} - {editingStaff?.name}
            </DialogTitle>
            <DialogDescription>
              {translate(
                "Personnalisez les permissions pour ce membre du personnel. Vous pouvez utiliser les permissions par défaut du rôle ou créer un ensemble personnalisé.",
                "قم بتخصيص الصلاحيات لهذا الموظف. يمكنك استخدام الصلاحيات الافتراضية للدور أو إنشاء مجموعة مخصصة."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{translate("Rôle actuel", "الدور الحالي")}</Label>
                <p className="text-sm text-muted-foreground">
                  {editingStaff && DEFAULT_ROLE_PERMISSIONS[editingStaff.role]?.name}
                </p>
              </div>
              <Button variant="outline" onClick={handleResetToRole}>
                {translate("Réinitialiser au rôle", "إعادة تعيين للدور")}
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(PERMISSION_GROUPS).map(([key, group]) => (
                <div key={key} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{group.label}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.permissions.map((permission) => {
                      const isChecked = customPermissions.includes(permission)
                      return (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission}
                            checked={isChecked}
                            onCheckedChange={() => handleTogglePermission(permission)}
                          />
                          <Label
                            htmlFor={permission}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {getPermissionLabel(permission)}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              {translate("Annuler", "إلغاء")}
            </Button>
            <Button onClick={handleSavePermissions}>
              <Save className="w-4 h-4 mr-2" />
              {translate("Enregistrer", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

