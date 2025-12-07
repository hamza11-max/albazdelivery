"use client"

import { handleError, safeFetch, parseAPIResponse, NetworkError } from "./errorHandling"

interface FetchAIInsightsParams {
  activeVendorId?: string
  setSalesForecast: (forecast: any) => void
  setInventoryRecommendations: (recommendations: any[]) => void
  setProductBundles: (bundles: any[]) => void
}

export async function fetchAIInsights({
  activeVendorId,
  setSalesForecast,
  setInventoryRecommendations,
  setProductBundles,
}: FetchAIInsightsParams) {
  try {
    const response = await safeFetch(`/api/erp/ai-insights${activeVendorId ? `?vendorId=${activeVendorId}` : ''}`)
    const data = await parseAPIResponse(response)
    if (data.success) {
      const d = data.data || {}
      setSalesForecast(d.forecast || null)
      setInventoryRecommendations(Array.isArray(d.recommendations) ? d.recommendations : [])
      setProductBundles(Array.isArray(d.bundles) ? d.bundles : [])
    } else {
      // Handle unsuccessful response
      setSalesForecast(null)
      setInventoryRecommendations([])
      setProductBundles([])
    }
  } catch (error) {
    handleError(error, {
      showToast: false, // Don't show toast for background data fetching
      logError: true,
    })
    // Set empty values on error
    setSalesForecast(null)
    setInventoryRecommendations([])
    setProductBundles([])
  }
}

