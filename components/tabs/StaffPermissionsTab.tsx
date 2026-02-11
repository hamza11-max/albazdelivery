"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Button } from "@/root/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Checkbox } from "@/root/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Label } from "@/root/components/ui/label"
import { Users, Shield, Plus, Edit, Trash2, Save } from "lucide-react"
import { StaffDialog, type StaffMember } from "../dialogs/StaffDialog"
import {
  DEFAULT_ROLE_PERMISSIONS,
  getRolePermissions,
  getStaffPermissions,
  saveStaffPermissions,
  type Permission,
  type StaffMember as PermStaffMember,
} from "../../utils/permissionsUtils"
import { useToast } from "@/root/hooks/use-toast"

interface StaffPermissionsTabProps {
  translate: (fr: string, ar: string) => string
}

const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
  pos: { label: "Point de Vente", permissions: ["pos.view", "pos.create", "pos.edit", "pos.delete"] },
  inventory: { label: "Inventaire", permissions: ["inventory.view", "inventory.create", "inventory.edit", "inventory.delete"] },
  sales: { label: "Ventes", permissions: ["sales.view", "sales.create", "sales.edit", "sales.delete"] },
  orders: { label: "Commandes", permissions: ["orders.view", "orders.edit", "orders.delete"] },
  customers: { label: "Clients", permissions: ["customers.view", "customers.create", "customers.edit", "customers.delete"] },
  staff: { label: "Personnel", permissions: ["staff.view", "staff.create", "staff.edit", "staff.delete"] },
  reports: { label: "Rapports", permissions: ["reports.view"] },
  settings: { label: "Paramètres", permissions: ["settings.view", "settings.edit"] },
  coupons: { label: "Coupons", permissions: ["coupons.view", "coupons.create", "coupons.edit", "coupons.delete"] },
  backup: { label: "Sauvegarde", permissions: ["backup.view", "backup.create", "backup.restore"] },
}

export function StaffPermissionsTab({ translate }: StaffPermissionsTabProps) {
  const { toast } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vendor-staff")
      return stored ? JSON.parse(stored) : []
    }
    return []
  })
  const [showStaffDialog, setShowStaffDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [editingStaff, setEditingStaff] = useState<PermStaffMember | null>(null)
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([])
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vendor-staff")
      if (stored) setStaff(JSON.parse(stored))
    }
  }, [])

  const handleAddStaff = () => {
    setSelectedStaff(null)
    setShowStaffDialog(true)
  }
  const handleEditStaff = (member: StaffMember) => {
    setSelectedStaff(member)
    setShowStaffDialog(true)
  }
  const handleDeleteStaff = (id: string) => {
    if (confirm(translate("Êtes-vous sûr de vouloir supprimer ce membre du personnel?", "هل أنت متأكد من حذف هذا الموظف?"))) {
      const updated = staff.filter((s) => s.id !== id)
      setStaff(updated)
      localStorage.setItem("vendor-staff", JSON.stringify(updated))
    }
  }
  const handleSaveStaff = (staffData: StaffMember) => {
    if (selectedStaff?.id) {
      const updated = staff.map((s) => (s.id === selectedStaff.id ? { ...staffData, id: selectedStaff.id } : s))
      setStaff(updated)
      localStorage.setItem("vendor-staff", JSON.stringify(updated))
    } else {
      const newStaff: StaffMember = { ...staffData, id: Date.now().toString() }
      const updated = [...staff, newStaff]
      setStaff(updated)
      localStorage.setItem("vendor-staff", JSON.stringify(updated))
    }
    setShowStaffDialog(false)
    setSelectedStaff(null)
  }

  const handleEditPermissions = (member: PermStaffMember) => {
    setEditingStaff(member)
    setCustomPermissions(getStaffPermissions(member))
    setShowPermissionsDialog(true)
  }
  const handleSavePermissions = () => {
    if (!editingStaff) return
    saveStaffPermissions(editingStaff.id, customPermissions)
    const updated = staff.map((s) => (s.id === editingStaff.id ? { ...s, permissions: customPermissions } : s))
    setStaff(updated)
    localStorage.setItem("vendor-staff", JSON.stringify(updated))
    toast({ title: translate("Permissions mises à jour", "تم تحديث الصلاحيات"), description: translate("Les permissions ont été enregistrées avec succès", "تم حفظ الصلاحيات بنجاح") })
    setShowPermissionsDialog(false)
    setEditingStaff(null)
  }
  const handleTogglePermission = (permission: Permission) => {
    if (customPermissions.includes(permission)) setCustomPermissions(customPermissions.filter((p) => p !== permission))
    else setCustomPermissions([...customPermissions, permission])
  }
  const handleResetToRole = () => {
    if (!editingStaff) return
    setCustomPermissions(getRolePermissions(editingStaff.role))
  }
  const getRoleLabel = (role: string) => {
    const roles: Record<string, { fr: string; ar: string }> = {
      owner: { fr: "Propriétaire", ar: "المالك" },
      manager: { fr: "Gestionnaire", ar: "المدير" },
      cashier: { fr: "Caissier", ar: "أمين الصندوق" },
      staff: { fr: "Personnel", ar: "موظف" },
    }
    const r = roles[role] || roles.staff
    return translate(r.fr, r.ar)
  }
  const getPermissionLabel = (permission: Permission): string => {
    const [, action] = permission.split(".")
    const labels: Record<string, string> = {
      view: translate("Voir", "عرض"),
      create: translate("Créer", "إنشاء"),
      edit: translate("Modifier", "تعديل"),
      delete: translate("Supprimer", "حذف"),
      restore: translate("Restaurer", "استعادة"),
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <h2 className="text-2xl font-bold">{translate("Personnel & Permissions", "الموظفون والصلاحيات")}</h2>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {translate("Gestion du personnel", "إدارة الموظفين")}
            </CardTitle>
            <Button onClick={handleAddStaff} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {translate("Ajouter", "إضافة")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{translate("Aucun membre du personnel", "لا يوجد موظفين")}</p>
              <Button onClick={handleAddStaff} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                {translate("Ajouter du personnel", "إضافة موظف")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Nom", "الاسم")}</TableHead>
                  <TableHead>{translate("Email", "البريد")}</TableHead>
                  <TableHead>{translate("Rôle", "الدور")}</TableHead>
                  <TableHead className="text-right">{translate("Actions", "الإجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell><Badge variant="secondary">{getRoleLabel(member.role)}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditPermissions(member as PermStaffMember)}>
                          <Shield className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditStaff(member)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => member.id && handleDeleteStaff(member.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {translate("Rôles et Permissions", "الأدوار والصلاحيات")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.values(DEFAULT_ROLE_PERMISSIONS).map((rp) => (
              <div key={rp.role} className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-1">{rp.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{rp.description}</p>
                <Badge variant="secondary">{rp.permissions.length} {translate("permissions", "صلاحيات")}</Badge>
              </div>
            ))}
          </div>
          {staff.length > 0 && (
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
                  const perms = getStaffPermissions(member as PermStaffMember)
                  const isCustom = member.permissions && (member as PermStaffMember).permissions?.length > 0
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell><Badge>{DEFAULT_ROLE_PERMISSIONS[member.role]?.name || member.role}</Badge></TableCell>
                      <TableCell>
                        <span className="text-sm">{perms.length} {translate("permissions", "صلاحيات")}</span>
                        {isCustom && <Badge variant="outline" className="ml-2 text-xs">{translate("Personnalisé", "مخصص")}</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditPermissions(member as PermStaffMember)}>
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

      <StaffDialog open={showStaffDialog} onOpenChange={setShowStaffDialog} staff={selectedStaff} translate={translate} onSave={handleSaveStaff} />

      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translate("Modifier les Permissions", "تعديل الصلاحيات")} - {editingStaff?.name}</DialogTitle>
            <DialogDescription>{translate("Personnalisez les permissions pour ce membre du personnel.", "قم بتخصيص الصلاحيات لهذا الموظف.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{translate("Rôle actuel", "الدور الحالي")}</Label>
                <p className="text-sm text-muted-foreground">{editingStaff && DEFAULT_ROLE_PERMISSIONS[editingStaff.role]?.name}</p>
              </div>
              <Button variant="outline" onClick={handleResetToRole}>{translate("Réinitialiser au rôle", "إعادة تعيين للدور")}</Button>
            </div>
            <div className="space-y-4">
              {Object.entries(PERMISSION_GROUPS).map(([key, group]) => (
                <div key={key} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{group.label}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.permissions.map((p) => (
                      <div key={p} className="flex items-center space-x-2">
                        <Checkbox id={p} checked={customPermissions.includes(p)} onCheckedChange={() => handleTogglePermission(p)} />
                        <Label htmlFor={p} className="text-sm font-normal cursor-pointer">{getPermissionLabel(p)}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>{translate("Annuler", "إلغاء")}</Button>
            <Button onClick={handleSavePermissions}><Save className="w-4 h-4 mr-2" />{translate("Enregistrer", "حفظ")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
