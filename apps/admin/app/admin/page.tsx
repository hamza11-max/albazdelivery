"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@albaz/ui"
import { Users, Truck, Store } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../../lib/csrf-client"
import { AdminHeader } from "../../components/AdminHeader"
import { DashboardView } from "../../components/DashboardView"
import { UserListView } from "../../components/UserListView"
import { UserListViewWithBulk } from "../../components/UserListViewWithBulk"
import { ApprovalsView } from "../../components/ApprovalsView"
import { AuditLogView } from "../../components/AuditLogView"
import { AdsManagementView } from "../../components/AdsManagementView"
import { AnalyticsDashboard } from "../../components/AnalyticsDashboard"
import { EditUserDialog } from "../../components/EditUserDialog"
import { DeleteUserDialog } from "../../components/DeleteUserDialog"
import { useAdminData } from "../../hooks/useAdminData"
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@albaz/ui"

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
  const [passkeyEmail, setPasskeyEmail] = useState("")
  const [passkeyResult, setPasskeyResult] = useState<{ passkey: string; expiresAt?: string | null } | null>(null)
  const [isGeneratingPasskey, setIsGeneratingPasskey] = useState(false)
  const [passkeyHistory, setPasskeyHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("approvals")

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

  const handleGeneratePasskey = async () => {
    if (!passkeyEmail) return
    setIsGeneratingPasskey(true)
    try {
      const response = await fetchWithCsrf("/api/admin/subscription-passkeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorEmail: passkeyEmail, expiresInDays: 7 }),
      })
      const data = await response.json()
      if (data?.success) {
        setPasskeyResult({ passkey: data.passkey, expiresAt: data.expiresAt || null })
        toast({
          title: "Clé générée",
          description: "Transmettez cette clé au propriétaire du site.",
        })
      } else {
        toast({
          title: "Erreur",
          description: data?.error || "Impossible de générer la clé",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer la clé",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPasskey(false)
    }
  }

  const loadPasskeyHistory = async () => {
    try {
      const response = await fetchWithCsrf("/api/admin/subscription-passkeys?limit=100", {
        method: "GET",
      })
      const data = await response.json()
      if (data?.success && Array.isArray(data.passkeys)) {
        setPasskeyHistory(data.passkeys)
      }
    } catch (error) {
      // ignore
    }
  }

  useEffect(() => {
    if (activeTab === "passkeys") {
      loadPasskeyHistory()
    }
  }, [activeTab])

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="approvals" className="relative">
              Approbations
              {registrationRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{registrationRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="command-center">Command Center</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
            <TabsTrigger value="drivers">Livreurs</TabsTrigger>
            <TabsTrigger value="vendors">Vendeurs</TabsTrigger>
            <TabsTrigger value="ads">Publicités</TabsTrigger>
            <TabsTrigger value="audit">Journal d'audit</TabsTrigger>
            <TabsTrigger value="passkeys">Passkeys</TabsTrigger>
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

          <TabsContent value="command-center">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">SLA</Badge>
                    Command Center
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Vue rapide des commandes à risque (SLA & espèces). Actions pourront être branchées sur l’API plus tard.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Commandes en risque SLA (&gt; 30 min)</h4>
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
                              Client: {(o as any).customer?.name || "N/A"} • Tel: {(o as any).customerPhone || (o as any).customer?.phone || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Créé: {new Date(o.createdAt || Date.now()).toLocaleString("fr-FR")}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm font-semibold">{o.total} DZD</p>
                            <p className="text-xs text-muted-foreground">Ville: {(o as any).city || "N/A"}</p>
                          </div>
                        </div>
                      ))}
                    {orders.length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucune commande disponible</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Surveillance espèces (&gt; 10k DZD)</h4>
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
                              Client: {(o as any).customer?.name || "N/A"} • Tel: {(o as any).customerPhone || (o as any).customer?.phone || "N/A"}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm font-semibold">{o.total} DZD</p>
                            <p className="text-xs text-muted-foreground">Mode: {(o as any).paymentMethod || "cash"}</p>
                          </div>
                        </div>
                      ))}
                    {orders.filter((o) => ((o as any).paymentMethod || "").toLowerCase() === "cash" && o.total > 10000).length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucune alerte espèces</p>
                    )}
                  </div>
                </CardContent>
              </Card>
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

          <TabsContent value="passkeys">
            <Card>
              <CardHeader>
                <CardTitle>Clé d’abonnement (passkey)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email vendeur</Label>
                  <Input
                    value={passkeyEmail}
                    onChange={(e) => setPasskeyEmail(e.target.value)}
                    placeholder="vendor@example.com"
                  />
                </div>
                <Button onClick={handleGeneratePasskey} disabled={isGeneratingPasskey}>
                  {isGeneratingPasskey ? "Génération..." : "Générer la clé"}
                </Button>
                {passkeyResult?.passkey && (
                  <div className="rounded-md border p-3 text-sm space-y-1">
                    <div className="font-semibold">Passkey</div>
                    <div className="font-mono">{passkeyResult.passkey}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(passkeyResult.passkey)}
                    >
                      Copier
                    </Button>
                    {passkeyResult.expiresAt && (
                      <div className="text-muted-foreground">
                        Expire le {new Date(passkeyResult.expiresAt).toLocaleString("fr-FR")}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Historique des passkeys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" onClick={loadPasskeyHistory}>
                  Actualiser
                </Button>
                {passkeyHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune clé trouvée</p>
                ) : (
                  passkeyHistory.slice(0, 20).map((item) => (
                    <div key={item.id} className="border rounded-md p-3 text-sm space-y-1">
                      <div className="font-medium">
                        {item.vendor?.name || "Vendor"} · {item.vendor?.email || "N/A"}
                      </div>
                      <div className="text-muted-foreground">
                        Créée: {new Date(item.createdAt).toLocaleString("fr-FR")}
                      </div>
                      {item.expiresAt && (
                        <div className="text-muted-foreground">
                          Expire: {new Date(item.expiresAt).toLocaleString("fr-FR")}
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        Statut: {item.usedAt ? "Utilisée" : "Non utilisée"}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
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
