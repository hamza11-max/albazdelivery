"use client"

import { handleError, safeFetch, parseAPIResponse, APIError, NetworkError } from "./errorHandling"

interface FetchDriversParams {
  activeVendorId?: string
  setConnectedDrivers: (drivers: any[]) => void
  setPendingDriverRequests: (requests: any[]) => void
  setLoadingDrivers: (loading: boolean) => void
}

export async function fetchDrivers({
  activeVendorId,
  setConnectedDrivers,
  setPendingDriverRequests,
  setLoadingDrivers,
}: FetchDriversParams) {
  if (!activeVendorId) return
  setLoadingDrivers(true)
  try {
    const response = await safeFetch("/api/vendors/drivers")
    const data = await parseAPIResponse(response)
    if (data.success) {
      setConnectedDrivers(data.data?.connectedDrivers || [])
      setPendingDriverRequests(data.data?.pendingRequests || [])
    } else {
      // Handle unsuccessful response
      setConnectedDrivers([])
      setPendingDriverRequests([])
    }
  } catch (error) {
    handleError(error, {
      showToast: false, // Don't show toast for background data fetching
      logError: true,
    })
    // Set empty arrays on error to prevent UI issues
    setConnectedDrivers([])
    setPendingDriverRequests([])
  } finally {
    setLoadingDrivers(false)
  }
}

interface RespondToDriverRequestParams {
  connectionId: string
  action: "accept" | "reject"
  fetchDrivers: () => Promise<void>
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
  playSuccessSound: () => void
}

export async function respondToDriverRequest({
  connectionId,
  action,
  fetchDrivers,
  toast,
  translate,
  playSuccessSound,
}: RespondToDriverRequestParams) {
  try {
    const response = await safeFetch("/api/vendors/drivers", {
      method: "POST",
      body: JSON.stringify({ connectionId, action }),
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      await fetchDrivers()
      toast({
        title: translate(
          action === "accept" ? "Demande acceptée" : "Demande refusée",
          action === "accept" ? "تم قبول الطلب" : "تم رفض الطلب"
        ),
        description: translate(
          action === "accept" ? "Le chauffeur a été ajouté à vos connexions" : "La demande a été refusée",
          action === "accept" ? "تمت إضافة السائق إلى اتصالاتك" : "تم رفض الطلب"
        ),
      })
      playSuccessSound()
    } else {
      const apiError = new APIError(
        data.error?.message || translate("Impossible de répondre à la demande", "تعذر الرد على الطلب"),
        response.status,
        data
      )
      handleError(apiError, { showToast: true, logError: true, translate, toast })
    }
  } catch (error) {
    handleError(error, {
      showToast: true,
      logError: true,
      translate,
      toast,
      fallbackMessage: {
        fr: "Une erreur est survenue lors de la réponse à la demande",
        ar: "حدث خطأ أثناء الرد على الطلب"
      }
    })
  }
}

