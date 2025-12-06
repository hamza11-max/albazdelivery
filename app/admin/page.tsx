"use client"

import { useState, useEffect } from "react"
import { OrderStatus } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  Truck,
  Store,
  ShoppingBag,
  TrendingUp,
  Search,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Sun,
  Moon,
  Package,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  Globe,
} from "lucide-react"
import type { Order, User as UserType, RegistrationRequest } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function AdminPanel() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const isAuthenticated = status === "authenticated"
  const [language, setLanguage] = useState("fr")
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme and language from storage
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('albaz-theme') || 'system'
      const storedLang = localStorage.getItem('albaz-language') || 'fr'
      
      setLanguage(storedLang)
      
      const isDark = storedTheme === 'dark' || 
        (storedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      setIsDarkMode(isDark)
    }
  }, [])
  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<UserType[]>([])
  const [drivers, setDrivers] = useState<UserType[]>([])
  const [vendors, setVendors] = useState<UserType[]>([])
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [ads, setAds] = useState<any[]>([])
  const [showAdDialog, setShowAdDialog] = useState(false)
  const [selectedAd, setSelectedAd] = useState<any | null>(null)
  const [adForm, setAdForm] = useState({
    titleFr: "",
    titleAr: "",
    descriptionFr: "",
    descriptionAr: "",
    imageUrl: "",
    linkUrl: "",
    isActive: true,
    displayOrder: 0,
  })

  useEffect(() => {
    if (status === "loading") return
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/login")
    }
  }, [status, isAuthenticated, user, router])

  useEffect(() => {
    if (!mounted) return
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = 'light'
    }
  }, [isDarkMode, mounted])

  // Apply language
  useEffect(() => {
    if (!mounted) return
    
    document.documentElement.lang = language
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    
    if (language === "ar") {
      document.documentElement.classList.add("rtl")
    } else {
      document.documentElement.classList.remove("rtl")
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('albaz-language', language)
    }
  }, [language, mounted])

  useEffect(() => {
    fetchOrders()
    fetchUsers()
    fetchRegistrationRequests()
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      const response = await fetch("/api/admin/ads")
      const data = await response.json()
      if (data.success && data.ads) {
        setAds(data.ads)
      }
    } catch (error) {
      console.error("Error fetching ads:", error)
      setAds([])
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders")
      const data = await response.json()
      
      console.log("[Admin] Fetched orders data:", data)
      
      const orders = data?.data?.orders ?? []
      setOrders(orders)
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
      setOrders([])
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      
      console.log("[Admin] Fetched users data:", data)
      
      // Safely handle undefined with fallback
      const users = data?.data?.users ?? []
      
      setCustomers(users.filter((u: UserType) => u.role.toLowerCase() === "customer"))
      setDrivers(users.filter((u: UserType) => u.role.toLowerCase() === "driver"))
      setVendors(users.filter((u: UserType) => u.role.toLowerCase() === "vendor"))
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
      // Set empty arrays on error
      setCustomers([])
      setDrivers([])
      setVendors([])
    }
  }

  const fetchRegistrationRequests = async () => {
    try {
      const response = await fetch("/api/admin/registration-requests")
      const data = await response.json()
      
      console.log("[Admin] Fetched registration requests:", data)
      
      const requests = data?.data?.requests ?? []
      setRegistrationRequests(requests)
    } catch (error) {
      console.error("[v0] Error fetching registration requests:", error)
      setRegistrationRequests([])
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch("/api/admin/registration-requests", {
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
      const response = await fetch("/api/admin/registration-requests", {
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

  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING).length 
  const completedOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED).length
  const totalRevenue = orders.filter((o) => o.status === OrderStatus.DELIVERED).reduce((sum, o) => sum + o.total, 0)

  const Header = () => (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="AL-baz"
              className="h-10 w-auto"
              onError={(e) => {
                const target = e.currentTarget
                target.onerror = null
                target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='36' viewBox='0 0 120 36'%3E%3Crect width='120' height='36' rx='10' fill='%232f5b2f'/%3E%3Ctext x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Inter,Arial' font-size='12' font-weight='700'%3EALBAZ%3C/text%3E%3C/svg%3E"
              }}
            />
            <div>
              <h1 className="text-lg font-bold">Panneau d'Administration</h1>
              <p className="text-xs text-white/80">AL-baz Delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setLanguage(language === "fr" ? "ar" : "fr")}
              title={language === "fr" ? "العربية" : "Français"}
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Commandes</p>
                <p className="text-3xl font-bold text-blue-900">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Revenu Total</p>
                <p className="text-3xl font-bold text-green-900">{totalRevenue}</p>
                <p className="text-xs text-green-700">DZD</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 mb-1">En Attente</p>
                <p className="text-3xl font-bold text-orange-900">{pendingOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 mb-1">Complétées</p>
                <p className="text-3xl font-bold text-purple-900">{completedOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{customers.length}</p>
            <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Livreurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{drivers.length}</p>
            <p className="text-sm text-muted-foreground">Personnel de livraison</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{vendors.length}</p>
            <p className="text-sm text-muted-foreground">Magasins partenaires</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commandes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">#{order.id}</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString("fr-DZ")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{order.total} DZD</p>
                  <Badge
                    variant={
                      order.status === OrderStatus.DELIVERED
                        ? "default"
                        : order.status === OrderStatus.CANCELLED
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const CustomersView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des Clients</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const DriversView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des Livreurs</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Livreur
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un livreur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{driver.name}</p>
                    <p className="text-sm text-muted-foreground">{driver.email}</p>
                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const VendorsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des Vendeurs</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Vendeur
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un vendeur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{vendor.name}</p>
                    <p className="text-sm text-muted-foreground">{vendor.email}</p>
                    <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const ApprovalsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Demandes d'inscription en attente</h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {registrationRequests.length} en attente
        </Badge>
      </div>

      {registrationRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Aucune demande en attente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrationRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      {request.role === "driver" ? (
                        <Truck className="w-7 h-7 text-primary" />
                      ) : (
                        <Store className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-lg">{request.name}</p>
                        <Badge variant="outline">{request.role === "driver" ? "Livreur" : "Vendeur"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <p className="text-sm text-muted-foreground">{request.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Demandé le {new Date(request.createdAt).toLocaleDateString("fr-DZ")}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedRequest(request)
                      setShowRequestDialog(true)
                    }}
                  >
                    Examiner
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>Examinez les informations et approuvez ou rejetez la demande</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Rôle</p>
                <p className="text-lg">{selectedRequest.role === "driver" ? "Livreur" : "Vendeur"}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">Nom</p>
                <p className="text-lg">{selectedRequest.name}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">Email</p>
                <p className="text-lg">{selectedRequest.email}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">Téléphone</p>
                <p className="text-lg">{selectedRequest.phone}</p>
              </div>

              {selectedRequest.licenseNumber && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Permis de conduire</p>
                  <p className="text-lg">{selectedRequest.licenseNumber}</p>
                </div>
              )}

              {selectedRequest.shopType && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Type de magasin</p>
                  <p className="text-lg">
                    {selectedRequest.shopType === "restaurant"
                      ? "Restaurant / Plats préparés"
                      : selectedRequest.shopType === "grocery"
                        ? "Épicerie"
                        : selectedRequest.shopType === "parapharmacy"
                          ? "Parapharmacie & Beauté"
                          : "Boutique de cadeaux"}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => selectedRequest && handleRejectRequest(selectedRequest.id)}
              className="flex-1"
            >
              <UserX className="w-4 h-4 mr-2" />
              Rejeter
            </Button>
            <Button
              onClick={() => selectedRequest && handleApproveRequest(selectedRequest.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="approvals" className="relative">
              Approbations
              {registrationRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{registrationRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="ads">Publicités</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
            <TabsTrigger value="drivers">Livreurs</TabsTrigger>
            <TabsTrigger value="vendors">Vendeurs</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <ApprovalsView />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardView />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersView />
          </TabsContent>

          <TabsContent value="drivers">
            <DriversView />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorsView />
          </TabsContent>

          <TabsContent value="ads">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestion des Publicités</h2>
                <Button onClick={() => {
                  setSelectedAd(null)
                  setAdForm({
                    titleFr: "",
                    titleAr: "",
                    descriptionFr: "",
                    descriptionAr: "",
                    imageUrl: "",
                    linkUrl: "",
                    isActive: true,
                    displayOrder: ads.length,
                  })
                  setShowAdDialog(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Publicité
                </Button>
              </div>

              <div className="grid gap-4">
                {ads.map((ad) => (
                  <Card key={ad.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold">{ad.titleFr}</h3>
                            <Badge variant={ad.isActive ? "default" : "secondary"}>
                              {ad.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{ad.descriptionFr}</p>
                          <p className="text-xs text-muted-foreground">Ordre: {ad.displayOrder}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAd(ad)
                              setAdForm({
                                titleFr: ad.titleFr,
                                titleAr: ad.titleAr,
                                descriptionFr: ad.descriptionFr,
                                descriptionAr: ad.descriptionAr,
                                imageUrl: ad.imageUrl || "",
                                linkUrl: ad.linkUrl || "",
                                isActive: ad.isActive,
                                displayOrder: ad.displayOrder,
                              })
                              setShowAdDialog(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (confirm("Êtes-vous sûr de vouloir supprimer cette publicité?")) {
                                try {
                                  const response = await fetch(`/api/admin/ads/${ad.id}`, {
                                    method: "DELETE",
                                  })
                                  const data = await response.json()
                                  if (data.success) {
                                    toast({
                                      title: "Succès",
                                      description: "Publicité supprimée",
                                    })
                                    fetchAds()
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Erreur",
                                    description: "Erreur lors de la suppression",
                                    variant: "destructive",
                                  })
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Ad Dialog */}
        <Dialog open={showAdDialog} onOpenChange={setShowAdDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAd ? "Modifier la Publicité" : "Nouvelle Publicité"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Titre (Français)</Label>
                  <Input
                    value={adForm.titleFr}
                    onChange={(e) => setAdForm({ ...adForm, titleFr: e.target.value })}
                    placeholder="Titre en français"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titre (Arabe)</Label>
                  <Input
                    value={adForm.titleAr}
                    onChange={(e) => setAdForm({ ...adForm, titleAr: e.target.value })}
                    placeholder="العنوان بالعربية"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description (Français)</Label>
                  <Input
                    value={adForm.descriptionFr}
                    onChange={(e) => setAdForm({ ...adForm, descriptionFr: e.target.value })}
                    placeholder="Description en français"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (Arabe)</Label>
                  <Input
                    value={adForm.descriptionAr}
                    onChange={(e) => setAdForm({ ...adForm, descriptionAr: e.target.value })}
                    placeholder="الوصف بالعربية"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL de l'image</Label>
                <Input
                  value={adForm.imageUrl}
                  onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label>URL du lien (optionnel)</Label>
                <Input
                  value={adForm.linkUrl}
                  onChange={(e) => setAdForm({ ...adForm, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ordre d'affichage</Label>
                  <Input
                    type="number"
                    value={adForm.displayOrder}
                    onChange={(e) => setAdForm({ ...adForm, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={adForm.isActive}
                    onChange={(e) => setAdForm({ ...adForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isActive">Actif</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const url = selectedAd ? `/api/admin/ads/${selectedAd.id}` : "/api/admin/ads"
                    const method = selectedAd ? "PUT" : "POST"
                    const response = await fetch(url, {
                      method,
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(adForm),
                    })
                    const data = await response.json()
                    if (data.success) {
                      toast({
                        title: "Succès",
                        description: selectedAd ? "Publicité modifiée" : "Publicité créée",
                      })
                      setShowAdDialog(false)
                      fetchAds()
                    } else {
                      toast({
                        title: "Erreur",
                        description: data.error || "Une erreur s'est produite",
                        variant: "destructive",
                      })
                    }
                  } catch (error) {
                    toast({
                      title: "Erreur",
                      description: "Une erreur s'est produite",
                      variant: "destructive",
                    })
                  }
                }}
              >
                {selectedAd ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
