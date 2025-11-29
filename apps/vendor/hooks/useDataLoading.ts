"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchAIInsights } from "../utils/aiUtils"
import { fetchDrivers as fetchDriversUtil } from "../utils/driverUtils"

interface UseDataLoadingParams {
  // Auth & User
  status: string
  isAuthenticated: boolean
  user: any
  isAdmin: boolean
  setIsAdmin: (admin: boolean) => void
  isElectronRuntime: boolean
  
  // Vendor selection
  selectedVendorId: string | null
  setSelectedVendorId: (id: string | null) => void
  setAvailableVendors: (vendors: Array<{ id: string; name: string }>) => void
  setIsLoadingVendors: (loading: boolean) => void
  
  // Active vendor
  activeVendorId?: string
  activeTab: string
  
  // Data loading
  handleDataLoad: (vendorId?: string) => Promise<void>
  
  // AI Insights
  setSalesForecast: (forecast: any) => void
  setInventoryRecommendations: (recommendations: any[]) => void
  setProductBundles: (bundles: any[]) => void
  
  // Drivers
  setConnectedDrivers: (drivers: any[]) => void
  setPendingDriverRequests: (requests: any[]) => void
  setLoadingDrivers: (loading: boolean) => void
  
  // Dark mode
  isDarkMode: boolean
  setIsDarkMode: (dark: boolean) => void
  
  // Toast & Translate
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
}

export function useDataLoading({
  status,
  isAuthenticated,
  user,
  isAdmin,
  setIsAdmin,
  isElectronRuntime,
  selectedVendorId,
  setSelectedVendorId,
  setAvailableVendors,
  setIsLoadingVendors,
  activeVendorId,
  activeTab,
  handleDataLoad,
  setSalesForecast,
  setInventoryRecommendations,
  setProductBundles,
  setConnectedDrivers,
  setPendingDriverRequests,
  setLoadingDrivers,
  isDarkMode,
  setIsDarkMode,
  toast,
  translate,
}: UseDataLoadingParams) {
  const router = useRouter()

  // Authentication & role handling
  useEffect(() => {
    // Skip auth redirect in Electron (handled by Electron's auth)
    if (isElectronRuntime) return
    
    if (status === "loading") return
    
    if (!isAuthenticated || !user) {
      router.push("/auth/login")
      return
    }
    
    const admin = user.role === "ADMIN"
    setIsAdmin(admin)
    if (!admin) {
      setSelectedVendorId(null)
    }
  }, [status, isAuthenticated, user, router, isElectronRuntime, setIsAdmin, setSelectedVendorId])

  // Load vendor list for admin users
  useEffect(() => {
    if (!isAdmin) {
      setAvailableVendors([])
      return
    }

    const controller = new AbortController()
    const loadVendors = async () => {
      try {
        setIsLoadingVendors(true)
        const response = await fetch('/api/admin/users?role=VENDOR&status=APPROVED&limit=500', {
          signal: controller.signal,
        })
        const data = await response.json()
        if (data?.success) {
          const vendors = Array.isArray(data.users)
            ? data.users.map((v: any) => ({ id: v.id, name: v.name || v.email || 'Vendor' }))
            : []
          setAvailableVendors(vendors)
          if (vendors.length && !selectedVendorId) {
            setSelectedVendorId(vendors[0].id)
          }
        }
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          console.error('[v0] Failed to load vendors:', error)
          toast({
            title: translate("Erreur", "خطأ"),
            description: translate("Impossible de charger la liste des vendeurs.", "تعذر تحميل قائمة التجار."),
            variant: "destructive",
          })
        }
      } finally {
        setIsLoadingVendors(false)
      }
    }

    loadVendors()

    return () => controller.abort()
  }, [isAdmin, selectedVendorId, toast, translate, setAvailableVendors, setIsLoadingVendors, setSelectedVendorId])

  // Load data when context changes
  useEffect(() => {
    if (status === "loading" || !isAuthenticated) return
    if (isAdmin && !selectedVendorId) return
    const vendorContextId = isAdmin ? selectedVendorId ?? undefined : undefined
    handleDataLoad(vendorContextId)
  }, [status, isAuthenticated, isAdmin, selectedVendorId, handleDataLoad])

  // Fetch Drivers when activeTab changes
  useEffect(() => {
    if (activeTab === "drivers" && activeVendorId) {
      fetchDriversUtil({
        activeVendorId,
        setConnectedDrivers,
        setPendingDriverRequests,
        setLoadingDrivers,
      })
    }
  }, [activeTab, activeVendorId, setConnectedDrivers, setPendingDriverRequests, setLoadingDrivers])

  // Fetch AI Insights when activeTab changes
  useEffect(() => {
    if (activeTab === "ai" && activeVendorId) {
      fetchAIInsights({
        activeVendorId,
        setSalesForecast,
        setInventoryRecommendations,
        setProductBundles,
      })
    }
  }, [activeTab, activeVendorId, setSalesForecast, setInventoryRecommendations, setProductBundles])

  // Dark mode persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add("dark")
        localStorage.setItem('vendor-dark-mode', 'true')
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem('vendor-dark-mode', 'false')
      }
    }
  }, [isDarkMode])

  // Initialize dark mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vendor-dark-mode')
      if (saved === 'true') {
        setIsDarkMode(true)
        document.documentElement.classList.add("dark")
      } else {
        setIsDarkMode(false)
        document.documentElement.classList.remove("dark")
      }
    }
  }, [setIsDarkMode])
}

