"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Checkbox } from "@/root/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Label } from "@/root/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import { StaffDialog, type StaffMember } from "../../../components/dialogs/StaffDialog"
import { Plus, Edit, Trash2, Users, Shield, Save } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import type { StaffUser } from "../../../components/types"
import VendorSidebar from "@/root/components/VendorSidebar"
import { VendorHeader } from "../../../components/VendorHeader"
import {
  DEFAULT_ROLE_PERMISSIONS,
  getRolePermissions,
  getStaffPermissions,
  saveStaffPermissions,
  type Permission,
  type Role,
  type StaffMember as PermissionsStaffMember,
} from "@/apps/vendor/utils/permissionsUtils"

export default function StaffManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null)
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [editingPermissionsStaff, setEditingPermissionsStaff] = useState<StaffUser | null>(null)
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([])

  const translate = (fr: string, ar: string) => {
    // Simple translation - in production, use proper i18n
    const lang = typeof window !== "undefined" ? localStorage.getItem("vendor-language") || "fr" : "fr"
    return lang === "ar" ? ar : fr
  }

  useEffect(() => {
    // Load current staff
    try {
      const stored = localStorage.getItem("vendor-current-staff")
      if (stored) {
        setCurrentStaff(JSON.parse(stored))
      }
    } catch {
      // ignore
    }

    loadStaff()
  }, [])

  const loadStaff = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/vendor/staff", {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff)
          // Also save to localStorage as backup
          localStorage.setItem("vendor-staff-list", JSON.stringify(data.staff))
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem("vendor-staff-list")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setStaffList(parsed)
          }
        }
      }
    } catch (err) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("vendor-staff-list")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setStaffList(parsed)
          }
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (staff: StaffMember) => {
    try {
      if (editingStaff) {
        // Update existing staff
        const updated = staffList.map(s => 
          s.id === editingStaff.id 
            ? { ...s, ...staff, id: editingStaff.id }
            : s
        )
        setStaffList(updated)
        localStorage.setItem("vendor-staff-list", JSON.stringify(updated))

        // Try API
        try {
          await fetch("/api/vendor/staff", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ ...staff, id: editingStaff.id }),
          })
        } catch {
          // ignore API errors, localStorage is the source of truth
        }

        toast({
          title: translate("Personnel mis à jour", "تم تحديث الموظف"),
          description: translate("Les informations ont été mises à jour", "تم تحديث المعلومات"),
        })
      } else {
        // Add new staff
        const newStaff: StaffUser = {
          id: `staff-${Date.now()}`,
          name: staff.name,
          email: staff.email,
          role: staff.role as any,
          password: staff.password,
        }
        const updated = [...staffList, newStaff]
        setStaffList(updated)
        localStorage.setItem("vendor-staff-list", JSON.stringify(updated))

        // Try API
        try {
          await fetch("/api/vendor/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify(newStaff),
          })
        } catch {
          // ignore API errors
        }

        toast({
          title: translate("Personnel ajouté", "تم إضافة الموظف"),
          description: translate("Le nouveau membre a été ajouté", "تم إضافة العضو الجديد"),
        })
      }

      setShowDialog(false)
      setEditingStaff(null)
    } catch (err: any) {
      toast({
        title: translate("Erreur", "خطأ"),
        description: err.message || translate("Une erreur s'est produite", "حدث خطأ"),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm(translate("Êtes-vous sûr de vouloir supprimer ce membre?", "هل أنت متأكد من حذف هذا العضو?"))) {
      return
    }

    try {
      const updated = staffList.filter(s => s.id !== staffId)
      setStaffList(updated)
      localStorage.setItem("vendor-staff-list", JSON.stringify(updated))

      // Try API
      try {
        await fetch("/api/vendor/staff", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ id: staffId }),
        })
      } catch {
        // ignore API errors
      }

      toast({
        title: translate("Personnel supprimé", "تم حذف الموظف"),
        description: translate("Le membre a été supprimé", "تم حذف العضو"),
      })
    } catch (err: any) {
      toast({
        title: translate("Erreur", "خطأ"),
        description: err.message || translate("Une erreur s'est produite", "حدث خطأ"),
        variant: "destructive",
      })
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return translate("Propriétaire", "المالك")
      case "manager":
        return translate("Gestionnaire", "المدير")
      case "cashier":
        return translate("Caissier", "أمين الصندوق")
      case "staff":
        return translate("Personnel", "موظف")
      default:
        return role
    }
  }

  const handleEditPermissions = (staff: StaffUser) => {
    setEditingPermissionsStaff(staff)
    // Convert StaffUser to StaffMember format for permissions
    const staffMember: PermissionsStaffMember = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role as Role,
      permissions: (staff as any).permissions || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    const currentPerms = getStaffPermissions(staffMember)
    setCustomPermissions(currentPerms)
    setShowPermissionsDialog(true)
  }

  const handleSavePermissions = () => {
    if (!editingPermissionsStaff) return

    saveStaffPermissions(editingPermissionsStaff.id, customPermissions)
    
    const updated = staffList.map((s) => {
      if (s.id === editingPermissionsStaff.id) {
        return { ...s, permissions: customPermissions }
      }
      return s
    })
    setStaffList(updated)
    localStorage.setItem("vendor-staff-list", JSON.stringify(updated))

    toast({
      title: translate("Permissions mises à jour", "تم تحديث الصلاحيات"),
      description: translate("Les permissions ont été enregistrées avec succès", "تم حفظ الصلاحيات بنجاح"),
    })

    setShowPermissionsDialog(false)
    setEditingPermissionsStaff(null)
  }

  const handleTogglePermission = (permission: Permission) => {
    if (customPermissions.includes(permission)) {
      setCustomPermissions(customPermissions.filter((p) => p !== permission))
    } else {
      setCustomPermissions([...customPermissions, permission])
    }
  }

  const handleResetToRole = () => {
    if (!editingPermissionsStaff) return
    const rolePerms = getRolePermissions(editingPermissionsStaff.role as Role)
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

  const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
    pos: {
      label: translate("Point de Vente", "نقطة البيع"),
      permissions: ["pos.view", "pos.create", "pos.edit", "pos.delete"],
    },
    inventory: {
      label: translate("Inventaire", "المخزون"),
      permissions: ["inventory.view", "inventory.create", "inventory.edit", "inventory.delete"],
    },
    sales: {
      label: translate("Ventes", "المبيعات"),
      permissions: ["sales.view", "sales.create", "sales.edit", "sales.delete"],
    },
    orders: {
      label: translate("Commandes", "الطلبات"),
      permissions: ["orders.view", "orders.edit", "orders.delete"],
    },
    customers: {
      label: translate("Clients", "العملاء"),
      permissions: ["customers.view", "customers.create", "customers.edit", "customers.delete"],
    },
    staff: {
      label: translate("Personnel", "الموظفون"),
      permissions: ["staff.view", "staff.create", "staff.edit", "staff.delete"],
    },
    reports: {
      label: translate("Rapports", "التقارير"),
      permissions: ["reports.view"],
    },
    settings: {
      label: translate("Paramètres", "الإعدادات"),
      permissions: ["settings.view", "settings.edit"],
    },
    coupons: {
      label: translate("Coupons", "الكوبونات"),
      permissions: ["coupons.view", "coupons.create", "coupons.edit", "coupons.delete"],
    },
    backup: {
      label: translate("Sauvegarde", "النسخ الاحتياطي"),
      permissions: ["backup.view", "backup.create", "backup.restore"],
    },
  }

  // Only owner can access this page
  if (currentStaff && currentStaff.role !== "owner") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <VendorHeader
          vendorName="AlBaz Vendor"
          currentStaff={currentStaff}
          onRoleChange={() => {}}
          translate={translate}
        />
        <VendorSidebar
          activeTab="staff"
          setActiveTab={(tab) => {
            if (tab === "staff") {
              // Already on staff page
              return
            }
            // Navigate to main vendor page
            router.push("/vendor")
            // Set the tab in localStorage so the main page can read it
            if (typeof window !== 'undefined') {
              localStorage.setItem('vendor-active-tab', tab)
            }
          }}
          translate={translate}
        />
        <main className="flex-1 w-full transition-all duration-300 pl-0 md:pl-[70px] pt-0 pb-20 md:pb-0 min-w-0 overflow-x-auto">
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">{translate("Accès refusé", "الوصول مرفوض")}</h2>
                <p className="text-muted-foreground">
                  {translate("Seul le propriétaire peut gérer le personnel", "المالك فقط يمكنه إدارة الموظفين")}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <VendorHeader
        vendorName="AlBaz Vendor"
        currentStaff={currentStaff}
        onRoleChange={() => {}}
        translate={translate}
      />
      <VendorSidebar
        activeTab="staff"
        setActiveTab={(tab) => {
          if (tab === "staff") {
            // Already on staff page
            return
          }
          // Navigate to main vendor page
          router.push("/vendor")
          // Set the tab in localStorage so the main page can read it
          if (typeof window !== 'undefined') {
            localStorage.setItem('vendor-active-tab', tab)
          }
        }}
        translate={translate}
      />
      <main className="flex-1 w-full transition-all duration-300 pl-0 md:pl-[70px] pt-0 pb-20 md:pb-0 min-w-0 overflow-x-auto">
        <div className="container mx-auto p-6 space-y-6">
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="staff">{translate("Personnel", "الموظفون")}</TabsTrigger>
              <TabsTrigger value="permissions">{translate("Permissions", "الصلاحيات")}</TabsTrigger>
            </TabsList>

            <TabsContent value="staff" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-teal-600" />
                  <div>
                    <h1 className="text-3xl font-bold">{translate("Gestion du Personnel", "إدارة الموظفين")}</h1>
                    <p className="text-muted-foreground">
                      {translate("Ajoutez et gérez les membres de votre équipe", "أضف وأدر أعضاء فريقك")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setEditingStaff(null)
                    setShowDialog(true)
                  }}
                  className="bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {translate("Ajouter du personnel", "إضافة موظف")}
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{translate("Liste du Personnel", "قائمة الموظفين")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">{translate("Chargement...", "جاري التحميل...")}</p>
                    </div>
                  ) : staffList.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        {translate("Aucun membre du personnel", "لا يوجد موظفون")}
                      </p>
                      <Button
                        onClick={() => {
                          setEditingStaff(null)
                          setShowDialog(true)
                        }}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {translate("Ajouter le premier membre", "إضافة أول موظف")}
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{translate("Nom", "الاسم")}</TableHead>
                          <TableHead>{translate("Email", "البريد الإلكتروني")}</TableHead>
                          <TableHead>{translate("Rôle", "الدور")}</TableHead>
                          <TableHead className="text-right">{translate("Actions", "الإجراءات")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffList.map((staff) => (
                          <TableRow key={staff.id}>
                            <TableCell className="font-medium">{staff.name}</TableCell>
                            <TableCell>{staff.email}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                                {getRoleLabel(staff.role)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingStaff(staff)
                                    setShowDialog(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(staff.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6 mt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-teal-600" />
                <div>
                  <h1 className="text-3xl font-bold">{translate("Gestion des Permissions", "إدارة الصلاحيات")}</h1>
                  <p className="text-muted-foreground">
                    {translate("Configurez les permissions pour chaque membre du personnel", "قم بتكوين الصلاحيات لكل موظف")}
                  </p>
                </div>
              </div>

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
                  {staffList.length === 0 ? (
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
                        {staffList.map((member) => {
                          const staffMember: PermissionsStaffMember = {
                            id: member.id,
                            name: member.name,
                            email: member.email,
                            role: member.role as Role,
                            permissions: (member as any).permissions || [],
                            isActive: true,
                            createdAt: new Date().toISOString(),
                          }
                          const perms = getStaffPermissions(staffMember)
                          const isCustom = (member as any).permissions && (member as any).permissions.length > 0
                          return (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>
                                <Badge>{DEFAULT_ROLE_PERMISSIONS[member.role as Role]?.name || member.role}</Badge>
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
            </TabsContent>
          </Tabs>

          <StaffDialog
            open={showDialog}
            onOpenChange={setShowDialog}
            staff={editingStaff ? {
              id: editingStaff.id,
              name: editingStaff.name,
              email: editingStaff.email,
              role: editingStaff.role,
              password: "",
            } : null}
            translate={translate}
            onSave={handleSave}
          />

          {/* Permissions Dialog */}
          <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {translate("Modifier les Permissions", "تعديل الصلاحيات")} - {editingPermissionsStaff?.name}
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
                      {editingPermissionsStaff && DEFAULT_ROLE_PERMISSIONS[editingPermissionsStaff.role as Role]?.name}
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
      </main>
    </div>
  )
}

