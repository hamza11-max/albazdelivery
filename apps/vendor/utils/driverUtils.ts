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

    // In dev / offline environments this endpoint may not exist.
    // Treat 404 as "no drivers" without logging noisy errors.
    if (response.status === 404) {
      setConnectedDrivers([])
      setPendingDriverRequests([])
      return
    }

    const data = await parseAPIResponse(response)
    if (data.success) {
      const payload = data.data
      setConnectedDrivers((payload?.connectedDrivers as any[]) || [])
      setPendingDriverRequests((payload?.pendingRequests as any[]) || [])
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

interface InviteDriverParams {
  email?: string
  phone?: string
  fetchDrivers: () => Promise<void>
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
  playSuccessSound: () => void
}

export async function inviteVendorDriver({
  email,
  phone,
  fetchDrivers,
  toast,
  translate,
  playSuccessSound,
}: InviteDriverParams) {
  const payload: Record<string, string> = {}
  const e = email?.trim()
  const p = phone?.trim()
  if (e) payload.email = e
  if (p) payload.phone = p

  try {
    const response = await safeFetch("/api/vendors/drivers/invite", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      await fetchDrivers()
      const already = data.data?.alreadyPending
      toast({
        title: translate(
          already ? "Invitation déjà envoyée" : "Invitation envoyée",
          already ? "الدعوة أرسلت مسبقاً" : "تم إرسال الدعوة"
        ),
        description: translate(
          already
            ? "Le chauffeur n’a pas encore accepté."
            : "Le chauffeur recevra une notification.",
          already
            ? "لم يقبل السائق بعد."
            : "سيتلقى السائق إشعاراً."
        ),
      })
      playSuccessSound()
    } else {
      const apiError = new APIError(
        data.error?.message ||
          translate("Impossible d’inviter le chauffeur", "تعذرت دعوة السائق"),
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
        fr: "Une erreur est survenue lors de l’invitation",
        ar: "حدث خطأ أثناء إرسال الدعوة",
      },
    })
  }
}

interface SetDriverDispatchParams {
  driverId: string
  availableForDispatch: boolean
  fetchDrivers: () => Promise<void>
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
  playSuccessSound: () => void
}

export async function setDriverDispatchAvailability({
  driverId,
  availableForDispatch,
  fetchDrivers,
  toast,
  translate,
  playSuccessSound,
}: SetDriverDispatchParams) {
  try {
    const response = await safeFetch(`/api/vendors/drivers/${encodeURIComponent(driverId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ availableForDispatch }),
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      await fetchDrivers()
      toast({
        title: translate("Statut chauffeur mis à jour", "تم تحديث حالة السائق"),
        description: availableForDispatch
          ? translate("Le chauffeur peut recevoir des courses.", "يمكن للسائق استلام الطلبات.")
          : translate("Le chauffeur est mis en pause pour les courses.", "السائق متوقف عن استلام الطلبات."),
      })
      playSuccessSound()
    } else {
      const apiError = new APIError(
        data.error?.message || translate("Impossible de mettre à jour le statut", "تعذر تحديث الحالة"),
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
        fr: "Erreur lors de la mise à jour du chauffeur",
        ar: "خطأ أثناء تحديث السائق",
      },
    })
  }
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

