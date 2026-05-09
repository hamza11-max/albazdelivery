"use client"

import { useState, useEffect, useRef } from "react"
import nextDynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@albaz/ui"
import { Users, Truck, Store, Layers, ShoppingCart, LayoutGrid, BarChart3, LifeBuoy, Boxes, CreditCard } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../../lib/csrf-client"
import { apiErrorMessage } from "../../lib/api-error-message"
import { useAdminI18n } from "../../lib/AdminI18nProvider"
import { AdminHeader } from "../../components/AdminHeader"
import { DashboardView } from "../../components/DashboardView"
import { UserListViewWithBulk } from "../../components/UserListViewWithBulk"
import { ApprovalsView } from "../../components/ApprovalsView"
import { AuditLogView } from "../../components/AuditLogView"
import { AdsManagementView } from "../../components/AdsManagementView"
function AnalyticsReportsLoading() {
  const { t } = useAdminI18n()
  return (
    <p className="text-sm text-muted-foreground py-8 text-center">
      {t("admin.loadingCharts", "Chargement des graphiques…", "جاري تحميل الرسوم…")}
    </p>
  )
}

const AnalyticsReportsView = nextDynamic(
  () =>
    import("../../components/AnalyticsReportsView").then((mod) => mod.AnalyticsReportsView),
  {
    ssr: false,
    loading: () => <AnalyticsReportsLoading />,
  }
)
import { EditUserDialog } from "../../components/EditUserDialog"
import { DeleteUserDialog } from "../../components/DeleteUserDialog"
import { useAdminData } from "../../hooks/useAdminData"
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@albaz/ui"
import { VendorDriverOperationsView } from "../../components/VendorDriverOperationsView"
import { OrderFinanceView } from "../../components/OrderFinanceView"
import { ContentOperationsView } from "../../components/ContentOperationsView"
import { AdminSupportTicketsView } from "../../components/AdminSupportTicketsView"
import { AdminProductsView } from "../../components/AdminProductsView"
import { PasskeysTab } from "@/root/components/tabs/PasskeysTab"
import { SubscriptionsManageView } from "../../components/SubscriptionsManageView"
import { canAccessAdminApp, isFullAdmin as isFullAdminRole, isSuperAdmin as isSuperAdminRole } from "@/root/lib/admin-roles"
type EditRole = "CUSTOMER" | "VENDOR" | "DRIVER" | "ADMIN" | "SUPER_ADMIN" | "SUPPORT"

export const dynamic = 'force-dynamic'

export default function AdminPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useAdminI18n()
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Edit/Delete state
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CUSTOMER" as EditRole,
    status: "APPROVED" as "PENDING" | "APPROVED" | "REJECTED",
    address: "",
    city: "",
  })

  // Registration requests state
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? "loading"
  const user = session?.user ?? null
  const isAuthenticated = status === "authenticated"

  const isSupportAgentUser = String(user?.role ?? "").toUpperCase() === "SUPPORT"
  const isFullAdminUser = isFullAdminRole(user?.role)
  const isSuperAdminUser = isSuperAdminRole(user?.role)

  const {
    orders,
    customers,
    drivers,
    vendors,
    registrationRequests,
    fetchUsers,
    fetchOrders,
    fetchRegistrationRequests,
  } = useAdminData(isSupportAgentUser ? "support" : "full")

  const adminNavInitialized = useRef(false)
  useEffect(() => {
    if (status !== "authenticated" || !user || adminNavInitialized.current) return
    adminNavInitialized.current = true
    if (isSupportAgentUser) setActiveTab("support")
    else setActiveTab("approvals")
  }, [status, user, isSupportAgentUser])

  useEffect(() => {
    if (status === "loading") return
    if (!isAuthenticated || !canAccessAdminApp(user?.role)) {
      router.push("/login")
    }
  }, [status, isAuthenticated, user, router])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // Handle approve/reject registration request
  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetchWithCsrf("/api/admin/registration-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "approve",
          adminId: user?.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t("admin.toast.approvedTitle"),
          description: t("admin.toast.approvedDesc"),
        })
        fetchRegistrationRequests()
        fetchUsers()
        setShowRequestDialog(false)
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(
            data.error,
            t("admin.err.approve", "Impossible d'approuver la demande", "تعذرت الموافقة على الطلب")
          ),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(
          error,
          t("admin.err.approve", "Impossible d'approuver la demande", "تعذرت الموافقة على الطلب")
        ),
        variant: "destructive",
      })
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetchWithCsrf("/api/admin/registration-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "reject",
          adminId: user?.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t("admin.toast.rejectedTitle"),
          description: t("admin.toast.rejectedDesc"),
        })
        fetchRegistrationRequests()
        setShowRequestDialog(false)
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("admin.err.reject", "Impossible de rejeter la demande", "تعذر رفض الطلب")),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(error, t("admin.err.reject", "Impossible de rejeter la demande", "تعذر رفض الطلب")),
        variant: "destructive",
      })
    }
  }

  // Passkeys are loaded inside PasskeysTab when the tab mounts

  // Handle edit user
  const handleEditUser = (user: UserType) => {
    setSelectedUser(user)
    const userWithStatus = user as UserType & { status?: string; address?: string; city?: string }
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: (user.role?.toUpperCase() as EditRole) || "CUSTOMER",
      status: (userWithStatus.status?.toUpperCase() as "PENDING" | "APPROVED" | "REJECTED") || "APPROVED",
      address: userWithStatus.address || "",
      city: userWithStatus.city || "",
    })
    setShowEditDialog(true)
  }

  // Handle save user
  const handleSaveUser = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      const response = await fetchWithCsrf(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t("common.success"),
          description: t("admin.toast.userUpdatedDesc"),
        })
        setShowEditDialog(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("admin.err.updateUser", "Impossible de mettre à jour l'utilisateur", "تعذر تحديث المستخدم")),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(error, t("admin.err.updateUser", "Impossible de mettre à jour l'utilisateur", "تعذر تحديث المستخدم")),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPassword = async (newPassword: string) => {
    if (!selectedUser) return
    setIsResettingPassword(true)
    try {
      const response = await fetchWithCsrf(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })
      const data = await response.json()
      if (data.success) {
        const extra = data.data?.notificationEmail ? ` (${data.data.notificationEmail})` : ""
        toast({
          title: t("admin.toast.passwordUpdatedTitle"),
          description: t("admin.toast.passwordUpdatedDesc") + extra,
        })
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("admin.err.resetPw", "Réinitialisation impossible", "تعذرت إعادة التعيين")),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("admin.err.resetPw", "Réinitialisation impossible", "تعذرت إعادة التعيين"),
        variant: "destructive",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const sessionUserId = user?.id
  const selectedRoleUpper = selectedUser ? String(selectedUser.role ?? "").toUpperCase() : ""
  const canResetSelectedUserPassword =
    !selectedUser ||
    Boolean(sessionUserId && selectedUser.id === sessionUserId) ||
    isSuperAdminUser ||
    (isFullAdminUser && !["ADMIN", "SUPER_ADMIN"].includes(selectedRoleUpper))

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsDeleting(true)
    try {
      const response = await fetchWithCsrf(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t("common.success"),
          description: t("admin.toast.userDeletedDesc"),
        })
        setShowDeleteDialog(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("admin.err.deleteUser", "Impossible de supprimer l'utilisateur", "تعذر حذف المستخدم")),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(error, t("admin.err.deleteUser", "Impossible de supprimer l'utilisateur", "تعذر حذف المستخدم")),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (action: string, userIds: string[]) => {
    try {
      const response = await fetchWithCsrf("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds,
          action,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const actionWord =
          action === "suspend"
            ? t("admin.toast.bulkSuspend")
            : action === "unsuspend"
              ? t("admin.toast.bulkActivate")
              : t("admin.toast.bulkDeleted")
        toast({
          title: t("common.success"),
          description: t("admin.toast.bulkSuccess", undefined, undefined, {
            count: String(data.affected),
            action: actionWord,
          }),
        })
        fetchUsers()
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("admin.err.bulk", "Impossible d'effectuer l'action en masse", "تعذرت الإجراءات الجماعية")),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: apiErrorMessage(error, t("admin.err.bulk", "Impossible d'effectuer l'action en masse", "تعذرت الإجراءات الجماعية")),
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        supportDesk={isSupportAgentUser}
      />
      <main className="container mx-auto px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            if (
              isSupportAgentUser &&
              !["dashboard", "support", "command-center"].includes(v)
            ) {
              return
            }
            setActiveTab(v)
          }}
          className="space-y-6"
        >
          <TabsList className="flex w-full flex-wrap gap-2 h-auto">
            {isFullAdminUser && (
              <TabsTrigger value="approvals" className="relative">
                {t("admin.approvals", "Approbations", "الموافقات")}
                {registrationRequests.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{registrationRequests.length}</Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="dashboard">
              {t("admin.dashboard", "Tableau de Bord", "لوحة التحكم")}
            </TabsTrigger>
            {isFullAdminUser && (
              <TabsTrigger value="analytics-reports">
                <span className="inline-flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  {t("admin.analytics", "Analytique", "تحليلات")}
                </span>
              </TabsTrigger>
            )}
            <TabsTrigger value="command-center">
              {t("admin.commandCenter", "Command Center", "مركز التحكم")}
            </TabsTrigger>
            {isFullAdminUser && (
              <>
                <TabsTrigger value="customers">{t("admin.customers", "Clients", "العملاء")}</TabsTrigger>
                <TabsTrigger value="drivers">{t("admin.drivers", "Livreurs", "السائقون")}</TabsTrigger>
                <TabsTrigger value="vendors">{t("admin.vendors", "Vendeurs", "البائعون")}</TabsTrigger>
                <TabsTrigger value="vendor-driver">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    {t("admin.opsVD", "Ops V/D", "عمليات بائع/سائق")}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="order-finance">
                  <span className="inline-flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4" />
                    {t("admin.orders", "Commandes", "الطلبات")}
                  </span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="support">
              <span className="inline-flex items-center gap-1.5">
                <LifeBuoy className="h-4 w-4" />
                {t("admin.support", "Support", "الدعم")}
              </span>
            </TabsTrigger>
            {isFullAdminUser && (
              <TabsTrigger value="products">
                <span className="inline-flex items-center gap-1.5">
                  <Boxes className="h-4 w-4" />
                  {t("admin.products", "Produits", "المنتجات")}
                </span>
              </TabsTrigger>
            )}
            {isFullAdminUser && (
              <>
                <TabsTrigger value="content">
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutGrid className="h-4 w-4" />
                    {t("admin.content", "Contenu", "المحتوى")}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="ads">{t("admin.ads", "Publicités", "الإعلانات")}</TabsTrigger>
                <TabsTrigger value="audit">{t("admin.audit", "Journal d'audit", "سجل التدقيق")}</TabsTrigger>
                <TabsTrigger value="passkeys">{t("admin.passkeys", "Passkeys", "مفاتيح المرور")}</TabsTrigger>
                <TabsTrigger value="subscriptions-admin">
                  <span className="inline-flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    {t("admin.subscriptions", "Abonnements", "الاشتراكات")}
                  </span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {isFullAdminUser && (
            <TabsContent value="approvals">
              <ApprovalsView
                requests={registrationRequests}
                selectedRequest={selectedRequest}
                showDialog={showRequestDialog}
                onRequestClick={(request) => {
                  setSelectedRequest(request)
                  setShowRequestDialog(true)
                }}
                onDialogChange={setShowRequestDialog}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
              />
            </TabsContent>
          )}

          <TabsContent value="dashboard">
            <div className="space-y-6">
              <DashboardView
                orders={orders}
                customers={customers}
                drivers={drivers}
                vendors={vendors}
                supportMode={isSupportAgentUser}
              />
            </div>
          </TabsContent>

          {isFullAdminUser && (
            <TabsContent value="analytics-reports">
              <AnalyticsReportsView />
            </TabsContent>
          )}

          <TabsContent value="command-center">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">SLA</Badge>
                    {t("admin.commandCenter.title")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isSupportAgentUser
                      ? t("admin.commandCenter.subSupport")
                      : t("admin.commandCenter.subFull")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">{t("admin.commandCenter.slaRisk")}</h4>
                    {orders
                      .filter((o) => {
                        const riskyStatus = ["PENDING", "ACCEPTED", "PREPARING"]
                        const age = Date.now() - new Date(o.createdAt || Date.now()).getTime()
                        return riskyStatus.includes((o.status || "").toUpperCase()) && age > 30 * 60 * 1000
                      })
                      .slice(0, 12)
                      .map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between rounded-lg border border-amber-200/70 bg-amber-50 px-3 py-2 text-amber-900"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">#{o.id}</span>
                              <Badge variant="outline">{o.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t("admin.commandCenter.client")}: {(o as any).customer?.name || "N/A"} • {t("admin.commandCenter.tel")}: {(o as any).customerPhone || (o as any).customer?.phone || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("admin.commandCenter.created")}: {new Date(o.createdAt || Date.now()).toLocaleString("fr-FR")}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm font-semibold">{o.total} DZD</p>
                            <p className="text-xs text-muted-foreground">{t("admin.commandCenter.city")}: {(o as any).city || "N/A"}</p>
                          </div>
                        </div>
                      ))}
                    {orders.length === 0 && (
                      <p className="text-sm text-muted-foreground">{t("admin.commandCenter.noOrders")}</p>
                    )}
                  </div>

                  {!isSupportAgentUser && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">{t("admin.commandCenter.cashWatch")}</h4>
                    {orders
                      .filter((o) => ((o as any).paymentMethod || "").toLowerCase() === "cash" && o.total > 10000)
                      .slice(0, 12)
                      .map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between rounded-lg border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-emerald-900"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">#{o.id}</span>
                              <Badge variant="outline">{o.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t("admin.commandCenter.client")}: {(o as any).customer?.name || "N/A"} • {t("admin.commandCenter.tel")}: {(o as any).customerPhone || (o as any).customer?.phone || "N/A"}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm font-semibold">{o.total} DZD</p>
                            <p className="text-xs text-muted-foreground">{t("admin.commandCenter.mode")}: {(o as any).paymentMethod || "cash"}</p>
                          </div>
                        </div>
                      ))}
                    {orders.filter((o) => ((o as any).paymentMethod || "").toLowerCase() === "cash" && o.total > 10000).length === 0 && (
                      <p className="text-sm text-muted-foreground">{t("admin.commandCenter.noCashAlert")}</p>
                    )}
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isFullAdminUser && (
            <>
              <TabsContent value="customers">
                <UserListViewWithBulk
                  users={customers}
                  title={t("admin.manageCustomers")}
                  icon={<Users className="w-6 h-6 text-primary" />}
                  emptyMessage={t("admin.emptyCustomer")}
                  searchPlaceholder={t("admin.searchCustomer")}
                  onEdit={handleEditUser}
                  onDelete={(user) => {
                    setSelectedUser(user)
                    setShowDeleteDialog(true)
                  }}
                  onBulkAction={handleBulkAction}
                />
              </TabsContent>

              <TabsContent value="drivers">
                <UserListViewWithBulk
                  users={drivers}
                  title={t("admin.manageDrivers")}
                  icon={<Truck className="w-6 h-6 text-primary" />}
                  emptyMessage={t("admin.emptyDriver")}
                  searchPlaceholder={t("admin.searchDriver")}
                  onEdit={handleEditUser}
                  onDelete={(user) => {
                    setSelectedUser(user)
                    setShowDeleteDialog(true)
                  }}
                  onBulkAction={handleBulkAction}
                />
              </TabsContent>

              <TabsContent value="vendors">
                <UserListViewWithBulk
                  users={vendors}
                  title={t("admin.manageVendors")}
                  icon={<Store className="w-6 h-6 text-primary" />}
                  emptyMessage={t("admin.emptyVendor")}
                  searchPlaceholder={t("admin.searchVendor")}
                  onEdit={handleEditUser}
                  onDelete={(user) => {
                    setSelectedUser(user)
                    setShowDeleteDialog(true)
                  }}
                  onBulkAction={handleBulkAction}
                  showActionLabels
                />
              </TabsContent>

              <TabsContent value="vendor-driver">
                <VendorDriverOperationsView drivers={drivers} orders={orders} onRefreshOrders={fetchOrders} />
              </TabsContent>

              <TabsContent value="order-finance">
                <OrderFinanceView customers={customers} orders={orders} onRefreshOrders={fetchOrders} />
              </TabsContent>
            </>
          )}

          <TabsContent value="support">
            <AdminSupportTicketsView />
          </TabsContent>

          {isFullAdminUser && (
            <>
              <TabsContent value="products">
                <AdminProductsView />
              </TabsContent>

              <TabsContent value="content">
                <ContentOperationsView />
              </TabsContent>

              <TabsContent value="ads">
                <AdsManagementView />
              </TabsContent>

              <TabsContent value="audit">
                <AuditLogView />
              </TabsContent>

              <TabsContent value="passkeys">
                <PasskeysTab vendors={vendors} onRefresh={fetchUsers} />
              </TabsContent>

              <TabsContent value="subscriptions-admin">
                <SubscriptionsManageView vendors={vendors} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <EditUserDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={selectedUser}
        form={editForm}
        onFormChange={setEditForm}
        onSave={handleSaveUser}
        isSaving={isSaving}
        onResetPassword={handleResetPassword}
        isResetting={isResettingPassword}
        canResetPassword={canResetSelectedUserPassword}
        allowSuperAdminRole={isSuperAdminUser}
      />

      <DeleteUserDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        user={selectedUser}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
      />
    </div>
  )
}
