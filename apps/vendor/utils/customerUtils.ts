"use client"

import type { Customer, CustomerForm } from "../app/vendor/types"
import { fetchCustomers } from "../app/vendor/refresh-data"
import { handleError, safeLocalStorageGet, safeLocalStorageSet, safeFetch, parseAPIResponse, APIError } from "./errorHandling"

interface SaveCustomerParams {
  customerForm: CustomerForm
  activeVendorId?: string
  isElectronRuntime: boolean
  setCustomers: (customers: Customer[]) => void
  setShowCustomerDialog: (show: boolean) => void
  resetCustomerForm: () => void
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
}

export async function saveCustomer({
  customerForm,
  activeVendorId,
  isElectronRuntime,
  setCustomers,
  setShowCustomerDialog,
  resetCustomerForm,
  toast,
  translate,
}: SaveCustomerParams) {
  // Electron offline mode
  if (isElectronRuntime) {
    const customerData = {
      ...customerForm,
      id: `customer-${Date.now()}`,
      vendorId: activeVendorId || 'local-vendor',
      createdAt: new Date().toISOString(),
    }
    
    const storedCustomers = safeLocalStorageGet<Customer[]>('electron-customers', [])
    storedCustomers.push(customerData)
    if (!safeLocalStorageSet('electron-customers', storedCustomers)) {
      throw new Error('Failed to save customer to localStorage')
    }
    setCustomers(storedCustomers)
    
    setShowCustomerDialog(false)
    resetCustomerForm()
    toast({
      title: translate("Client ajouté", "تم إضافة العميل"),
      description: translate("Sauvegardé localement", "تم الحفظ محلياً"),
      variant: "default",
    })
    return
  }
  
  try {
    const response = await safeFetch(`/api/erp/customers${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`, {
      method: "POST",
      body: JSON.stringify(customerForm),
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      await fetchCustomers(activeVendorId)
      setShowCustomerDialog(false)
      resetCustomerForm()
      toast({
        title: translate("Client ajouté", "تم إضافة العميل"),
        description: translate("Le client a été ajouté avec succès", "تمت إضافة العميل بنجاح."),
      })
    } else {
      const apiError = new APIError(
        data.error?.message || translate("Impossible d'ajouter le client", "تعذر إضافة العميل"),
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
        fr: "Une erreur est survenue lors de la sauvegarde du client",
        ar: "حدث خطأ أثناء حفظ العميل"
      }
    })
  }
}

