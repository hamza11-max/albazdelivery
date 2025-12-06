"use client"

import { useState, useEffect } from "react"
import { OrderStatus } from "@/root/lib/constants"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Phone,
  Package,
  CheckCircle2,
  Clock,
  DollarSign,
  Navigation,
  ArrowLeft,
  RefreshCw,
  Truck,
  AlertCircle,
  Home,
  List,
  TrendingUp,
  Sun,
  Moon,
  LogOut,
  Globe,
} from "lucide-react"
import type { Order } from "@/root/lib/types"
import { useSSE } from "@/root/lib/use-sse"
import { useToast } from "@/root/hooks/use-toast"
import { useSession, signOut } from "next-auth/react"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function DriverApp() {
  const router = useRouter()
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [language, setLanguage] = useState("fr")
  const [currentView, setCurrentView] = useState<"dashboard" | "active" | "history">("dashboard")
  const [availableDeliveries, setAvailableDeliveries] = useState<Order[]>([])
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null)
  const [deliveryHistory, setDeliveryHistory] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [driverId] = useState("driver-1")
  const { toast } = useToast()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)
  
  // Safely handle useSession during build time - it may return undefined during static generation
  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? "loading"
  const user = session?.user ?? null
  const isAuthenticated = status === "authenticated"
  
  const { data: sseData, isConnected } = useSSE(`/api/notifications/sse?role=driver&userId=${driverId}`, false)

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Erreur",
        description: "La géolocalisation n'est pas disponible",
        variant: "destructive",
      })
      return
    }

    setIsTrackingLocation(true)

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords
        setDriverLocation({ lat: latitude, lng: longitude })

        // Send location to server
        fetch("/api/driver/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId,
            latitude,
            longitude,
            accuracy,
            heading: heading || 0,
            speed: speed || 0,
          }),
        }).catch((error) => console.error("[v0] Error sending location:", error))
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        toast({
          title: "Erreur de géolocalisation",
          description: "Impossible d'accéder à votre position",
          variant: "destructive",
        })
      },
    )

    // Watch position for continuous tracking
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords
        setDriverLocation({ lat: latitude, lng: longitude })

        // Send location to server every 10 seconds
        fetch("/api/driver/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId,
            latitude,
            longitude,
            accuracy,
            heading: heading || 0,
            speed: speed || 0,
          }),
        }).catch((error) => console.error("[v0] Error sending location:", error))
      },
      (error) => console.error("[v0] Watch position error:", error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      setIsTrackingLocation(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    if (!isAuthenticated || user?.role !== "DRIVER") {
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

  useEffect(() => {
    if (sseData?.type === "order_ready") {
      fetchAvailableDeliveries()
      toast({
        title: "Nouvelle Livraison Disponible!",
        description: `Commande #${sseData.order?.id} prête pour récupération`,
        duration: 5000,
      })
    }
  }, [sseData])

  // Fetch available deliveries
  const fetchAvailableDeliveries = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/drivers/deliveries?available=true')
      const data = await response.json()
      
      console.log('[Driver] Available deliveries:', data)
      
      if (data.success && data.data?.deliveries) {
        setAvailableDeliveries(data.data.deliveries)
      } else {
        setAvailableDeliveries([])
      }
    } catch (error) {
      console.error('[Driver] Error fetching deliveries:', error)
      setAvailableDeliveries([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch active delivery
  const fetchActiveDelivery = async () => {
    try {
      const response = await fetch('/api/drivers/deliveries')
      const data = await response.json()
      
      console.log('[Driver] Fetched deliveries:', data)
      
      if (data.success && data.data?.deliveries) {
        const deliveries = data.data.deliveries
        const active = deliveries.find((d: Order) => d.status === OrderStatus.ASSIGNED || d.status === OrderStatus.IN_DELIVERY)
        setActiveDelivery(active || null)

        // Get completed deliveries for history
        const completed = deliveries.filter((d: Order) => d.status === OrderStatus.DELIVERED)
        setDeliveryHistory(completed)
      } else {
        // No deliveries yet
        setActiveDelivery(null)
        setDeliveryHistory([])
      }
    } catch (error) {
      console.error('[Driver] Error fetching active delivery:', error)
      setActiveDelivery(null)
      setDeliveryHistory([])
    }
  }

  // Accept delivery
  const acceptDelivery = async (orderId: string) => {
    try {
      const response = await fetch('/api/drivers/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await response.json()
      if (data.success) {
        setActiveDelivery(data.order)
        setCurrentView("active")
        fetchAvailableDeliveries()
      }
    } catch (error) {
      console.error("[v0] Error accepting delivery:", error)
    }
  }

  // Update delivery status
  const updateDeliveryStatus = async (orderId: string, status: "in_delivery" | "delivered") => {
    try {
      const response = await fetch(`/api/drivers/deliveries/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, driverId }),
      })
      const data = await response.json()
      if (data.success) {
        if (status === "delivered") {
          setActiveDelivery(null)
          setCurrentView("dashboard")
          fetchAvailableDeliveries()
          fetchActiveDelivery()
        } else {
          setActiveDelivery(data.order)
        }
      }
    } catch (error) {
      console.error("[v0] Error updating delivery status:", error)
    }
  }

  // Initial load
  useEffect(() => {
    const stopTracking = startLocationTracking()
    fetchAvailableDeliveries()
    fetchActiveDelivery()

    // Poll more frequently (every 5 seconds instead of 10)
    const interval = setInterval(() => {
      fetchAvailableDeliveries()
      fetchActiveDelivery()
    }, 5000)

    return () => {
      if (stopTracking) stopTracking()
      clearInterval(interval)
    }
  }, [driverId])

  const t = (fr: string, ar: string) => (language === "ar" ? ar : fr)

  // Header Component
  const Header = () => (
    <header className="sticky top-0 z-50 albaz-nav text-[var(--albaz-text)] dark:text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/albaz-logo.gif"
              alt="AL-baz"
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='36' viewBox='0 0 120 36'%3E%3Crect width='120' height='36' rx='10' fill='%232f5b2f'/%3E%3Ctext x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Inter,Arial' font-size='12' font-weight='700'%3EALBAZ%3C/text%3E%3C/svg%3E"
              }}
            />
            <div>
              <h1 className="text-lg font-bold text-[var(--albaz-text)] dark:text-white">{t("AL-baz Driver", "سائق AL-baz")}</h1>
              <p className="text-xs text-[var(--albaz-text-soft)] dark:text-white/80">{user?.name || "Driver"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10"
              onClick={() => setLanguage(language === "fr" ? "ar" : "fr")}
              title={language === "fr" ? "العربية" : "Français"}
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10"
              onClick={() => {
                fetchAvailableDeliveries()
                fetchActiveDelivery()
              }}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )

  // Dashboard View - Available Deliveries
  const DashboardView = () => (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="albaz-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--albaz-olive)] flex items-center justify-center text-white">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--albaz-text)]">{deliveryHistory.length}</p>
                <p className="text-xs text-[var(--albaz-text-soft)]">Livraisons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="albaz-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--albaz-olive)] flex items-center justify-center text-white">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--albaz-text)]">{deliveryHistory.length * 500}</p>
                <p className="text-xs text-[var(--albaz-text-soft)]">DZD Gagnés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Delivery Alert */}
      {activeDelivery && (
        <Card className="albaz-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-[var(--albaz-olive)]" />
              <div className="flex-1">
                <p className="font-semibold text-[var(--albaz-text)]">Livraison en cours</p>
                <p className="text-sm text-[var(--albaz-text-soft)]">Commande #{activeDelivery.id}</p>
              </div>
              <Button size="sm" className="bg-[var(--albaz-olive)] hover:brightness-95 text-white" onClick={() => setCurrentView("active")}>
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Deliveries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--albaz-text)]">Livraisons Disponibles</h2>
          <Badge className="bg-[var(--albaz-olive)] text-white">{availableDeliveries.length} disponible(s)</Badge>
        </div>

        {availableDeliveries.length === 0 ? (
          <Card className="albaz-card">
            <CardContent className="p-12 text-center text-[var(--albaz-text-soft)]">
              <Package className="w-16 h-16 mx-auto mb-4 text-[var(--albaz-text-soft)]" />
              <p className="text-lg mb-2">Aucune livraison disponible</p>
              <p className="text-sm opacity-80">Vérifiez à nouveau dans quelques instants</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {availableDeliveries.map((delivery) => (
            <Card key={delivery.id} className="albaz-card hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Order Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-[var(--albaz-olive)] text-white">Prêt</Badge>
                        <span className="text-sm font-mono text-[var(--albaz-text-soft)]">#{delivery.id}</span>
                        </div>
                      <p className="font-semibold text-[var(--albaz-text)]">Commande de {delivery.total} DZD</p>
                      <p className="text-sm text-[var(--albaz-text-soft)]">{delivery.items.length} article(s)</p>
                      </div>
                      <div className="text-right">
                      <p className="text-2xl font-bold text-[var(--albaz-olive)]">500 DZD</p>
                      <p className="text-xs text-[var(--albaz-text-soft)]">Frais de livraison</p>
                      </div>
                    </div>

                    {/* Pickup & Delivery */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-[var(--albaz-text-soft)] mt-0.5" />
                        <div className="flex-1">
                        <p className="text-xs text-[var(--albaz-text-soft)]">Récupération</p>
                        <p className="text-sm font-medium text-[var(--albaz-text)]">Store #{delivery.storeId}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[var(--albaz-olive)] mt-0.5" />
                        <div className="flex-1">
                        <p className="text-xs text-[var(--albaz-text-soft)]">Livraison</p>
                        <p className="text-sm font-medium text-[var(--albaz-text)]">{delivery.deliveryAddress}</p>
                        <p className="text-xs text-[var(--albaz-text-soft)]">{delivery.city}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-[var(--albaz-text-soft)] mt-0.5" />
                        <div className="flex-1">
                        <p className="text-xs text-[var(--albaz-text-soft)]">Client</p>
                        <p className="text-sm font-medium text-[var(--albaz-text)]">{delivery.customerPhone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                      className="flex-1 bg-[var(--albaz-olive)] hover:brightness-95 text-white"
                        onClick={() => acceptDelivery(delivery.id)}
                        disabled={!!activeDelivery}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Accepter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Active Delivery View
  const ActiveDeliveryView = () => {
    if (!activeDelivery) {
      return (
        <div className="container mx-auto px-4 py-6">
          <Card className="albaz-card">
            <CardContent className="p-12 text-center text-[var(--albaz-text-soft)]">
              <Package className="w-16 h-16 mx-auto mb-4 text-[var(--albaz-text-soft)]" />
              <p className="text-lg text-[var(--albaz-text)]">Aucune livraison active</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    const isPickedUp = activeDelivery.status === OrderStatus.IN_DELIVERY

    return (
      <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Status Card */}
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-orange-500/5">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary mx-auto flex items-center justify-center">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Commande</p>
                <p className="text-2xl font-bold text-gray-900">#{activeDelivery.id}</p>
              </div>
              <Badge className={isPickedUp ? "bg-blue-500" : "bg-green-500"}>
                {isPickedUp ? "En Livraison" : "Assigné"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la Commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Total Commande</span>
              <span className="font-bold text-gray-900">{activeDelivery.total} DZD</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Articles</span>
              <span className="font-semibold text-gray-900">{activeDelivery.items.length}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Paiement</span>
              <Badge variant="outline">{activeDelivery.paymentMethod === "cash" ? "Espèces" : "Carte"}</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Vos Frais</span>
              <span className="font-bold text-primary text-xl">500 DZD</span>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Point de Récupération
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900">Store #{activeDelivery.storeId}</p>
              <p className="text-sm text-gray-600">123 Rue Didouche Mourad, {activeDelivery.city}</p>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              <Navigation className="w-4 h-4 mr-2" />
              Naviguer vers le magasin
            </Button>
          </CardContent>
        </Card>

        {/* Delivery Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Adresse de Livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900">{activeDelivery.deliveryAddress}</p>
              <p className="text-sm text-gray-600">{activeDelivery.city}</p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-4 h-4 text-gray-600" />
              <div className="flex-1">
                <p className="text-xs text-gray-600">Contact Client</p>
                <p className="font-semibold text-gray-900">{activeDelivery.customerPhone}</p>
              </div>
              <Button size="sm" variant="outline">
                Appeler
              </Button>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              <Navigation className="w-4 h-4 mr-2" />
              Naviguer vers le client
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isPickedUp ? (
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-orange-500 text-lg"
              onClick={() => updateDeliveryStatus(activeDelivery.id, "in_delivery")}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Commande Récupérée
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-lg"
              onClick={() => updateDeliveryStatus(activeDelivery.id, "delivered")}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Marquer comme Livrée
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="w-full bg-transparent"
            onClick={() => setCurrentView("dashboard")}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au Tableau de Bord
          </Button>
        </div>
      </div>
    )
  }

  // History View
  const HistoryView = () => (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Historique</h2>
        <Badge variant="secondary">{deliveryHistory.length} livraison(s)</Badge>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1">Total Gagné</p>
              <p className="text-3xl font-bold text-green-900">{deliveryHistory.length * 500} DZD</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {deliveryHistory.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600">Aucune livraison terminée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deliveryHistory.map((delivery) => (
            <Card key={delivery.id} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">#{delivery.id}</p>
                      <p className="text-xs text-gray-600">
                        {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString("fr-DZ") : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+500 DZD</p>
                    <p className="text-xs text-gray-600">{delivery.city}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Bottom Navigation
  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around py-3 px-4">
        <button
          onClick={() => setCurrentView("dashboard")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === "dashboard" ? "text-primary" : "text-gray-400"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Accueil</span>
        </button>
        <button
          onClick={() => setCurrentView("active")}
          className={`flex flex-col items-center gap-1 transition-colors relative ${
            currentView === "active" ? "text-primary" : "text-gray-400"
          }`}
        >
          <Truck className="w-6 h-6" />
          {activeDelivery && <span className="absolute -top-1 right-2 w-2 h-2 bg-primary rounded-full"></span>}
          <span className="text-xs font-medium">Active</span>
        </button>
        <button
          onClick={() => setCurrentView("history")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === "history" ? "text-primary" : "text-gray-400"
          }`}
        >
          <List className="w-6 h-6" />
          <span className="text-xs font-medium">Historique</span>
        </button>
      </div>
    </nav>
  )

  return (
    <div className={`min-h-screen bg-background ${isDarkMode ? "dark" : ""}`}>
      <Header />
      <main>
        {currentView === "dashboard" && <DashboardView />}
        {currentView === "active" && <ActiveDeliveryView />}
        {currentView === "history" && <HistoryView />}
      </main>
      <BottomNav />
    </div>
  )
}
