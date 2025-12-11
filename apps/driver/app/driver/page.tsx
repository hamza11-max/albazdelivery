"use client"

import { useState, useEffect } from "react"
import { OrderStatus } from "@/root/lib/constants"
import { useRouter } from "next/navigation"
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Label } from "@albaz/ui"
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
  const [currentView, setCurrentView] = useState<"dashboard" | "active" | "history" | "earnings">("dashboard")
  const [availableDeliveries, setAvailableDeliveries] = useState<Order[]>([])
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null)
  const [activeVendorProfile, setActiveVendorProfile] = useState<any | null>(null)
  const [stackedDeliveries, setStackedDeliveries] = useState<Order[]>([])
  const [deliveryHistory, setDeliveryHistory] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [driverId] = useState("driver-1")
  const [isOnShift, setIsOnShift] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("driver-on-shift") === "true"
  })
  const [isAvailableForBatches, setIsAvailableForBatches] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("driver-accept-batches") !== "false"
  })
  const [shiftToastShown, setShiftToastShown] = useState(false)
  const [podPhoto, setPodPhoto] = useState<string | null>(null)
  const [podCode, setPodCode] = useState("")
  const [codCollected, setCodCollected] = useState(false)
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
    try {
      localStorage.setItem("driver-on-shift", isOnShift ? "true" : "false")
      localStorage.setItem("driver-accept-batches", isAvailableForBatches ? "true" : "false")
    } catch {
      // ignore
    }

    if (!isOnShift && !shiftToastShown) {
      toast({
        title: "Vous êtes hors ligne",
        description: "Passez en ligne pour accepter des livraisons",
      })
      setShiftToastShown(true)
    }
    if (isOnShift) {
      setShiftToastShown(false)
    }
  }, [isOnShift, isAvailableForBatches])

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
        const vendorId = (active as any)?.vendorId
        if (vendorId) {
          fetchVendorProfile(vendorId)
        } else {
          setActiveVendorProfile(null)
        }
      } else {
        // No deliveries yet
        setActiveDelivery(null)
        setDeliveryHistory([])
        setActiveVendorProfile(null)
      }
    } catch (error) {
      console.error('[Driver] Error fetching active delivery:', error)
      setActiveDelivery(null)
      setDeliveryHistory([])
      setActiveVendorProfile(null)
    }
  }

  // Accept delivery
  const acceptDelivery = async (orderId: string) => {
    try {
      if (!isOnShift) {
        toast({
          title: "Shift inactif",
          description: "Activez votre disponibilité avant d'accepter une livraison.",
          variant: "destructive",
        })
        return
      }

      if (!isAvailableForBatches && (activeDelivery || stackedDeliveries.length > 0)) {
        toast({
          title: "Batching désactivé",
          description: "Activez le batching pour empiler plusieurs livraisons.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/drivers/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await response.json()
      if (data.success) {
        if (!activeDelivery) {
          setActiveDelivery(data.order)
          setCurrentView("active")
          if ((data.order as any)?.vendorId) {
            fetchVendorProfile((data.order as any).vendorId)
          }
        } else {
          setStackedDeliveries((prev) => [...prev, data.order])
          toast({
            title: "Livraison ajoutée",
            description: "Livraison empilée (batch).",
          })
        }
        fetchAvailableDeliveries()
      }
    } catch (error) {
      console.error("[v0] Error accepting delivery:", error)
    }
  }

  // Update delivery status
  const updateDeliveryStatus = async (orderId: string, status: "in_delivery" | "delivered") => {
    if (status === "delivered") {
      const requiresPod = activeDelivery && (activeDelivery as any).payment?.method === "CASH"
      if (requiresPod && (!podCode || podCode.trim().length < 3 || !codCollected)) {
        toast({
          title: "Preuve de livraison requise",
          description: "Entrez un code PIN et confirmez l'encaissement.",
          variant: "destructive",
        })
        return
      }
    }

    try {
      const response = await fetch(`/api/drivers/deliveries/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, driverId, podCode }),
      })
      const data = await response.json()
      if (data.success) {
        if (status === "delivered") {
          setPodCode("")
          setCodCollected(false)
          setPodPhoto(null)
          if (stackedDeliveries.length > 0) {
            const [next, ...rest] = stackedDeliveries
            setStackedDeliveries(rest)
            setActiveDelivery(next)
            if ((next as any)?.vendorId) {
              fetchVendorProfile((next as any).vendorId)
            } else {
              setActiveVendorProfile(null)
            }
            setCurrentView("active")
          } else {
            setActiveDelivery(null)
            setActiveVendorProfile(null)
            setCurrentView("dashboard")
          }
          fetchAvailableDeliveries()
          fetchActiveDelivery()
        } else {
          setActiveDelivery(data.order)
          if ((data.order as any)?.vendorId) {
            fetchVendorProfile((data.order as any).vendorId)
          }
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

  const fetchVendorProfile = useCallback(async (vendorId: string) => {
    try {
      const res = await fetch(`/api/vendor/profile?vendorId=${vendorId}`)
      if (!res.ok) {
        setActiveVendorProfile(null)
        return
      }
      const data = await res.json()
      if (data?.success && data.profile) {
        setActiveVendorProfile(data.profile)
      } else {
        setActiveVendorProfile(null)
      }
    } catch (error) {
      console.warn("[Driver] Failed to fetch vendor profile", error)
      setActiveVendorProfile(null)
    }
  }, [])

  const t = (fr: string, ar: string) => (language === "ar" ? ar : fr)

  // Header Component
  const Header = () => (
    <header className="sticky top-0 z-50 albaz-nav text-[var(--albaz-text)] dark:text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AL-baz" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-[var(--albaz-text)] dark:text-white">{t("AL-baz Driver", "سائق AL-baz")}</h1>
              <p className="text-xs text-[var(--albaz-text-soft)] dark:text-white/80">{user?.name || "Driver"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 text-xs">
              <span className="font-semibold">{isOnShift ? "En ligne" : "Hors ligne"}</span>
              <Badge variant={isOnShift ? "default" : "secondary"} className="text-[10px] px-2">
                {isAvailableForBatches ? "Batch ON" : "Batch OFF"}
              </Badge>
            </div>
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
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10"
              onClick={() =>
                toast({
                  title: "Assistance demandée",
                  description: "Support et dispatch ont été notifiés.",
                })
              }
            >
              <AlertCircle className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--albaz-text)] dark:text-white hover:bg-white/10"
              onClick={() => window.open("tel:+21300000000", "_blank")}
            >
              <Phone className="w-5 h-5" />
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
      {/* Earnings Summary */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--albaz-text)]">Earnings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="albaz-card">
            <CardContent className="p-4">
              <p className="text-sm text-[var(--albaz-text-soft)]">Total (toutes livraisons)</p>
              <p className="text-2xl font-bold text-[var(--albaz-text)]">
                {deliveryHistory.reduce((sum, d) => sum + (d.total || 0), 0)} DZD
              </p>
            </CardContent>
          </Card>
          <Card className="albaz-card">
            <CardContent className="p-4">
              <p className="text-sm text-[var(--albaz-text-soft)]">Semaine (7 jours)</p>
              <p className="text-2xl font-bold text-[var(--albaz-text)]">
                {deliveryHistory
                  .filter((d) => Date.now() - new Date(d.createdAt || Date.now()).getTime() <= 7 * 24 * 60 * 60 * 1000)
                  .reduce((sum, d) => sum + (d.total || 0), 0)} DZD
              </p>
            </CardContent>
          </Card>
          <Card className="albaz-card">
            <CardContent className="p-4">
              <p className="text-sm text-[var(--albaz-text-soft)]">Moyenne / livraison</p>
              <p className="text-2xl font-bold text-[var(--albaz-text)]">
                {deliveryHistory.length > 0
                  ? Math.round(
                      deliveryHistory.reduce((sum, d) => sum + (d.total || 0), 0) / deliveryHistory.length,
                    )
                  : 0} DZD
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shift & Safety */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="albaz-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Disponibilité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--albaz-text-soft)]">En service</span>
              <Button variant={isOnShift ? "default" : "outline"} onClick={() => setIsOnShift(!isOnShift)}>
                {isOnShift ? "En ligne" : "Hors ligne"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--albaz-text-soft)]">Accepter des livraisons groupées</span>
              <Button variant={isAvailableForBatches ? "default" : "outline"} onClick={() => setIsAvailableForBatches(!isAvailableForBatches)}>
                {isAvailableForBatches ? "Oui" : "Non"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="albaz-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Sécurité & Urgence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              onClick={() =>
                toast({
                  title: "Assistance demandée",
                  description: "Support et dispatch ont été notifiés.",
                })
              }
            >
              Alerter le support
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("tel:+21300000000", "_blank")}
            >
              Appeler le support
            </Button>
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
          <div className="flex items-center gap-2">
            <Badge className="bg-[var(--albaz-olive)] text-white">{availableDeliveries.length} dispo</Badge>
            {isAvailableForBatches && availableDeliveries.length > 1 && (
              <Badge variant="outline" className="border-[var(--albaz-olive)] text-[var(--albaz-olive)]">
                Batchable
              </Badge>
            )}
          </div>
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
                      <div className="flex items-center justify-end gap-2 text-xs mt-1">
                        <Badge variant={isOnShift ? "default" : "secondary"}>{isOnShift ? "En ligne" : "Hors ligne"}</Badge>
                        <Badge variant={isAvailableForBatches ? "default" : "outline"}>{isAvailableForBatches ? "Batch ON" : "Batch OFF"}</Badge>
                      </div>
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            if (!delivery.storeId) {
                              toast({ title: "Adresse indisponible", description: "Impossible d'ouvrir la navigation", variant: "destructive" })
                              return
                            }
                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Store " + delivery.storeId)}`
                            window.open(url, "_blank")
                          }}
                        >
                          Naviguer
                        </Button>
                      </div>
                      <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[var(--albaz-olive)] mt-0.5" />
                        <div className="flex-1">
                        <p className="text-xs text-[var(--albaz-text-soft)]">Livraison</p>
                        <p className="text-sm font-medium text-[var(--albaz-text)]">{delivery.deliveryAddress}</p>
                        <p className="text-xs text-[var(--albaz-text-soft)]">{delivery.city}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            if (!delivery.deliveryAddress) {
                              toast({ title: "Adresse indisponible", description: "Impossible d'ouvrir la navigation", variant: "destructive" })
                              return
                            }
                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.deliveryAddress)}`
                            window.open(url, "_blank")
                          }}
                        >
                          Naviguer
                        </Button>
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
                        disabled={!!activeDelivery || !isOnShift}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {isOnShift ? "Accepter" : "Hors ligne"}
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

    const isCOD = (activeDelivery as any)?.payment?.method === "CASH" || activeDelivery.paymentMethod === "cash"

    return (
      <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Status Card */}
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-orange-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center overflow-hidden border border-white/50">
                {activeVendorProfile?.logo ? (
                  <img src={activeVendorProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Truck className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Commande #{activeDelivery.id}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {activeVendorProfile?.name || "Restaurant partenaire"}
                    </p>
                  </div>
                  <Badge className={isPickedUp ? "bg-blue-500" : "bg-green-500"}>
                    {isPickedUp ? "En Livraison" : "Assigné"}
                  </Badge>
                </div>
                {(activeVendorProfile?.address || activeVendorProfile?.phone || activeVendorProfile?.email) && (
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {activeVendorProfile.address && <p>{activeVendorProfile.address}</p>}
                    {activeVendorProfile.phone && <p>{activeVendorProfile.phone}</p>}
                    {activeVendorProfile.email && <p>{activeVendorProfile.email}</p>}
                  </div>
                )}
              </div>
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
              <Badge variant="outline">{isCOD ? "Espèces" : "Carte"}</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Restaurant</span>
              <span className="font-semibold text-gray-900 text-right">
                {activeVendorProfile?.name || "Partenaire"}
                {activeVendorProfile?.phone && <p className="text-xs text-gray-500">{activeVendorProfile.phone}</p>}
              </span>
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
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Store " + activeDelivery.storeId)}`
                window.open(url, "_blank")
              }}
            >
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
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeDelivery.deliveryAddress || "")}`
                window.open(url, "_blank")
              }}
            >
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
            <div className="space-y-3">
              {isCOD && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Preuve de livraison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Label>Code PIN client</Label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={podCode}
                      onChange={(e) => setPodCode(e.target.value)}
                      placeholder="Ex: 1234"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="cod-collected"
                        checked={codCollected}
                        onChange={(e) => setCodCollected(e.target.checked)}
                      />
                      <Label htmlFor="cod-collected" className="text-sm">Espèces collectées</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Photo de livraison (optionnel)</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => {
                            setPodPhoto(reader.result as string)
                            toast({
                              title: "Photo ajoutée",
                              description: "Preuve visuelle enregistrée (locale)",
                            })
                          }
                          reader.readAsDataURL(file)
                        }}
                      />
                      {podPhoto && (
                        <div className="mt-2 space-y-2">
                          <img src={podPhoto} alt="Preuve de livraison" className="h-32 w-auto rounded-md border" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPodPhoto(null)}
                          >
                            Retirer la photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-lg"
                onClick={() => updateDeliveryStatus(activeDelivery.id, "delivered")}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Marquer comme Livrée
              </Button>
              {stackedDeliveries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Livraisons empilées ({stackedDeliveries.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stackedDeliveries.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span className="font-mono">#{d.id}</span>
                        <Badge variant="outline">{(d as any).paymentMethod || "cash"}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
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

  const EarningsView = () => {
    const completed = deliveryHistory || []
    const totalAll = completed.reduce((sum, d) => sum + (d.total || 0), 0)
    const totalWeek = completed
      .filter((d) => Date.now() - new Date(d.createdAt || Date.now()).getTime() <= 7 * 24 * 60 * 60 * 1000)
      .reduce((sum, d) => sum + (d.total || 0), 0)
    const avg = completed.length > 0 ? Math.round(totalAll / completed.length) : 0

    return (
      <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="albaz-card">
            <CardContent className="p-4">
              <p className="text-sm text-[var(--albaz-text-soft)]">Total</p>
              <p className="text-2xl font-bold text-[var(--albaz-text)]">{totalAll} DZD</p>
            </CardContent>
          </Card>
          <Card className="albaz-card">
            <CardContent className="p-4">
              <p className="text-sm text-[var(--albaz-text-soft)]">7 derniers jours</p>
              <p className="text-2xl font-bold text-[var(--albaz-text)]">{totalWeek} DZD</p>
            </CardContent>
          </Card>
          <Card className="albaz-card">
            <CardContent className="p-4">
              <p className="text-sm text-[var(--albaz-text-soft)]">Moyenne / livraison</p>
              <p className="text-2xl font-bold text-[var(--albaz-text)]">{avg} DZD</p>
            </CardContent>
          </Card>
        </div>

        <Card className="albaz-card">
          <CardHeader>
            <CardTitle>Livraisons terminées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune livraison terminée pour le moment</p>
            ) : (
              completed.slice(0, 20).map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">#{d.id}</span>
                      <Badge variant="outline">{(d as any).paymentMethod || "cash"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(d.createdAt || Date.now()).toLocaleString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{d.total} DZD</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

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
        <button
          onClick={() => setCurrentView("earnings")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === "earnings" ? "text-primary" : "text-gray-400"
          }`}
        >
          <DollarSign className="w-6 h-6" />
          <span className="text-xs font-medium">Gains</span>
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
        {currentView === "earnings" && <EarningsView />}
      </main>
      <BottomNav />
    </div>
  )
}
