"use client"

import { handleError, safeFetch, parseAPIResponse, APIError } from "./errorHandling"
import { isElectronOfflineInventoryVendorId } from "./electronUtils"

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
  if (isElectronOfflineInventoryVendorId(activeVendorId)) {
    setSalesForecast(null)
    setInventoryRecommendations([])
    setProductBundles([])
    return
  }
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
    const quiet401 = error instanceof APIError && error.statusCode === 401
    handleError(error, {
      showToast: false,
      logError: !quiet401,
    })
    // Set empty values on error
    setSalesForecast(null)
    setInventoryRecommendations([])
    setProductBundles([])
  }
}

