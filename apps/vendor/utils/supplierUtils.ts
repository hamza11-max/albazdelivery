"use client"

import type { Supplier, SupplierForm } from "../app/vendor/types"
import { fetchSuppliers } from "../app/vendor/refresh-data"
import { handleError, safeLocalStorageGet, safeLocalStorageSet, safeFetch, parseAPIResponse, APIError } from "./errorHandling"

interface SaveSupplierParams {
  supplierForm: SupplierForm
  activeVendorId?: string
  isElectronRuntime: boolean
  setSuppliers: (suppliers: Supplier[]) => void
  setShowSupplierDialog: (show: boolean) => void
  setSupplierForm: (form: SupplierForm) => void
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
}

export async function saveSupplier({
  supplierForm,
  activeVendorId,
  isElectronRuntime,
  setSuppliers,
  setShowSupplierDialog,
  setSupplierForm,
  toast,
  translate,
}: SaveSupplierParams) {
  // Electron offline mode
  if (isElectronRuntime) {
    const supplierData = {
      ...supplierForm,
      id: `supplier-${Date.now()}`,
      vendorId: activeVendorId || 'local-vendor',
      createdAt: new Date().toISOString(),
    }
    
    const storedSuppliers = safeLocalStorageGet<Supplier[]>('electron-suppliers', [])
    storedSuppliers.push(supplierData)
    if (!safeLocalStorageSet('electron-suppliers', storedSuppliers)) {
      throw new Error('Failed to save supplier to localStorage')
    }
    setSuppliers(storedSuppliers)
    
    setShowSupplierDialog(false)
    setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" })
    toast({
      title: translate("Fournisseur ajouté", "تم إضافة المورد"),
      description: translate("Sauvegardé localement", "تم الحفظ محلياً"),
    })
    return
  }
  
  try {
    const response = await safeFetch(`/api/erp/suppliers${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`, {
      method: "POST",
      body: JSON.stringify({
        ...supplierForm,
        vendorId: activeVendorId,
      }),
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      await fetchSuppliers(activeVendorId)
      setShowSupplierDialog(false)
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" })
      toast({
        title: translate("Fournisseur ajouté", "تم إضافة المورد"),
        description: translate("Le fournisseur a été ajouté avec succès", "تمت إضافة المورد بنجاح."),
      })
    } else {
      const apiError = new APIError(
        data.error?.message || translate("Impossible d'ajouter le fournisseur", "تعذر إضافة المورد"),
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
        fr: "Une erreur est survenue lors de la sauvegarde du fournisseur",
        ar: "حدث خطأ أثناء حفظ المورد"
      }
    })
  }
}

