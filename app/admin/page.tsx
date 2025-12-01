"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@albaz/ui"
import { Users, Truck, Store } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "./lib/csrf-client"
import { AdminHeader } from "./components/AdminHeader"
import { DashboardView } from "./components/DashboardView"
import { UserListView } from "./components/UserListView"
import { UserListViewWithBulk } from "./components/UserListViewWithBulk"
import { ApprovalsView } from "./components/ApprovalsView"
import { AuditLogView } from "./components/AuditLogView"
import { AdsManagementView } from "./components/AdsManagementView"
import { AnalyticsDashboard } from "./components/AnalyticsDashboard"
import { EditUserDialog } from "./components/EditUserDialog"
import { DeleteUserDialog } from "./components/DeleteUserDialog"
import { useAdminData } from "./hooks/useAdminData"

export const dynamic = 'force-dynamic'

export default function AdminPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const [language, setLanguage] = useState("fr")
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Edit/Delete state
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CUSTOMER" as "CUSTOMER" | "VENDOR" | "DRIVER" | "ADMIN",
    status: "APPROVED" as "PENDING" | "APPROVED" | "REJECTED",
    address: "",
    city: "",
  })

  // Registration requests state
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)

  // Data fetching
  const {
    orders,
    customers,
    drivers,
    vendors,
    registrationRequests,
    fetchUsers,
    fetchRegistrationRequests,
  } = useAdminData()

  // Session handling
  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? "loading"
  const user = session?.user ?? null
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    if (status === "loading") return
    if (!isAuthenticated || user?.role !== "ADMIN") {
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
          title: "Approuvé",
          description: "L'utilisateur a été approuvé avec succès",
        })
        fetchRegistrationRequests()
        fetchUsers()
        setShowRequestDialog(false)
      } else {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la demande",
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
          title: "Rejeté",
          description: "La demande a été rejetée",
        })
        fetchRegistrationRequests()
        setShowRequestDialog(false)
      } else {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande",
        variant: "destructive",
      })
    }
  }

  // Handle edit user
  const handleEditUser = (user: UserType) => {
    setSelectedUser(user)
    const userWithStatus = user as UserType & { status?: string; address?: string; city?: string }
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: (user.role?.toUpperCase() as "CUSTOMER" | "VENDOR" | "DRIVER" | "ADMIN") || "CUSTOMER",
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
          title: "Succès",
          description: "L'utilisateur a été mis à jour avec succès",
        })
        setShowEditDialog(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de mettre à jour l'utilisateur",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'utilisateur",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

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
          title: "Succès",
          description: "L'utilisateur a été supprimé avec succès",
        })
        setShowDeleteDialog(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de supprimer l'utilisateur",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
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
        toast({
          title: "Succès",
          description: `${data.affected} utilisateur(s) ${action === 'suspend' ? 'suspendu(s)' : action === 'unsuspend' ? 'activé(s)' : 'supprimé(s)'} avec succès`,
        })
        fetchUsers()
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible d'effectuer l'action en masse",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'action en masse",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="approvals" className="relative">
              Approbations
              {registrationRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{registrationRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
            <TabsTrigger value="drivers">Livreurs</TabsTrigger>
            <TabsTrigger value="vendors">Vendeurs</TabsTrigger>
            <TabsTrigger value="ads">Publicités</TabsTrigger>
            <TabsTrigger value="audit">Journal d'audit</TabsTrigger>
          </TabsList>

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

          <TabsContent value="dashboard">
            <div className="space-y-6">
              <DashboardView
                orders={orders}
                customers={customers}
                drivers={drivers}
                vendors={vendors}
              />
              <AnalyticsDashboard />
            </div>
          </TabsContent>

          <TabsContent value="customers">
            <UserListViewWithBulk
              users={customers}
              title="Gestion des Clients"
              icon={<Users className="w-6 h-6 text-primary" />}
              emptyMessage="Aucun client"
              searchPlaceholder="Rechercher un client..."
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
              title="Gestion des Livreurs"
              icon={<Truck className="w-6 h-6 text-primary" />}
              emptyMessage="Aucun livreur"
              searchPlaceholder="Rechercher un livreur..."
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
              title="Gestion des Vendeurs"
              icon={<Store className="w-6 h-6 text-primary" />}
              emptyMessage="Aucun vendeur"
              searchPlaceholder="Rechercher un vendeur..."
              onEdit={handleEditUser}
              onDelete={(user) => {
                setSelectedUser(user)
                setShowDeleteDialog(true)
              }}
              onBulkAction={handleBulkAction}
            />
          </TabsContent>

          <TabsContent value="ads">
            <AdsManagementView />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogView />
          </TabsContent>
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
