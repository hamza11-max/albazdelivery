"use client"

import type { Supplier, SupplierForm } from "../app/vendor/types"
import { fetchSuppliers } from "../app/vendor/refresh-data"
import { handleError, safeLocalStorageGet, safeLocalStorageSet, safeFetch, parseAPIResponse, APIError } from "./errorHandling"
import { engine, engineSuppliers, hasEngine } from "../lib/engine"

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
  // Desktop app: suppliers live in the local engine (deliveries are linked to them).
  if (hasEngine()) {
    try {
      await engine("suppliers:save", { name: supplierForm.name, phone: supplierForm.phone, note: [supplierForm.contactPerson, supplierForm.email, supplierForm.address].filter(Boolean).join(" · ") })
      setSuppliers(await engineSuppliers())
      setShowSupplierDialog(false)
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" })
      toast({ title: translate("Fournisseur ajouté", "تمت إضافة المورد"), description: supplierForm.name })
    } catch (error) {
      handleError(error, { showToast: true, logError: true, translate, toast })
    }
    return
  }

  // Electron offline mode
  if (isElectronRuntime) {
    const supplierData = {
      ...supplierForm,
      id: `supplier-${Date.now()}`,
      vendorId: activeVendorId || 'local-vendor',
      productsSupplied: [] as string[],
      createdAt: new Date(),
    } as Supplier
    
    const storedSuppliers = safeLocalStorageGet<Supplier[]>('electron-suppliers', [])
    storedSuppliers.push(supplierData)
    if (!safeLocalStorageSet('electron-suppliers', storedSuppliers)) {
      throw new Error('Failed to save supplier to localStorage')
    }
    setSuppliers(storedSuppliers)
    
    setShowSupplierDialog(false)
    setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" })
    toast({
      title: translate("Fournisseur ajouté", "تمت إضافة المورد"),
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
        title: translate("Fournisseur ajouté", "تمت إضافة المورد"),
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

