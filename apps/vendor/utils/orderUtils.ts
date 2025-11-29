"use client"

import { handleError, safeFetch, parseAPIResponse, APIError } from "./errorHandling"

interface UpdateOrderStatusParams {
  orderId: string
  status: string
  fetchOrders: (vendorId?: string) => Promise<any>
  activeVendorId?: string
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
  playSuccessSound?: () => void
}

export async function updateOrderStatus({
  orderId,
  status,
  fetchOrders,
  activeVendorId,
  toast,
  translate,
  playSuccessSound,
}: UpdateOrderStatusParams) {
  try {
    const response = await safeFetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      await fetchOrders(activeVendorId)
      
      const statusMessages: Record<string, { fr: string; ar: string }> = {
        ACCEPTED: { fr: "Commande acceptée", ar: "تم قبول الطلب" },
        PREPARING: { fr: "Commande en préparation", ar: "الطلب قيد التحضير" },
        READY: { fr: "Commande prête", ar: "الطلب جاهز" },
        CANCELLED: { fr: "Commande annulée", ar: "تم إلغاء الطلب" },
      }

      const message = statusMessages[status] || { fr: "Statut mis à jour", ar: "تم تحديث الحالة" }
      toast({
        title: translate(message.fr, message.ar),
        description: translate("Le client sera notifié", "سيتم إشعار العميل"),
        variant: "default",
      })
      if (playSuccessSound) {
        playSuccessSound()
      }
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
        fr: "Une erreur est survenue lors de la mise à jour du statut",
        ar: "حدث خطأ أثناء تحديث الحالة"
      }
    })
  }
}

