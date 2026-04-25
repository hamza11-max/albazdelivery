"use client"

import type { InventoryProduct, ProductForm } from "../app/vendor/types"
import { fetchInventory, fetchDashboardData, fetchProducts } from "../app/vendor/refresh-data"
import { handleError, safeLocalStorageGet, safeLocalStorageSet, safeFetch, parseAPIResponse, APIError, ValidationError } from "./errorHandling"
import { isElectronOfflineInventoryVendorId } from "./electronUtils"

interface SaveProductParams {
  productForm: ProductForm
  editingProduct: InventoryProduct | null
  activeVendorId?: string
  isElectronRuntime: boolean
  setProducts: (products: InventoryProduct[]) => void
  setLowStockProducts: (products: InventoryProduct[]) => void
  setProductForm: (form: ProductForm) => void
  setEditingProduct: (product: InventoryProduct | null) => void
  setShowProductDialog: (show: boolean) => void
  fetchInventory?: (vendorId?: string) => Promise<any>
  fetchDashboardData?: (vendorId?: string) => Promise<any>
  fetchProducts?: (vendorId?: string) => Promise<InventoryProduct[] | null>
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
}

export async function saveProduct({
  productForm,
  editingProduct,
  activeVendorId,
  isElectronRuntime,
  setProducts,
  setLowStockProducts,
  setProductForm,
  setEditingProduct,
  setShowProductDialog,
  fetchInventory: refreshInventory = fetchInventory,
  fetchDashboardData: refreshDashboard = fetchDashboardData,
  fetchProducts: refreshProducts = fetchProducts,
  toast,
  translate,
}: SaveProductParams) {
  try {
    const vid = activeVendorId || 'electron-vendor'
    const productData = {
      ...productForm,
      id: editingProduct?.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      costPrice: Math.max(0.01, Number.parseFloat(String(productForm.costPrice)) || 0.01),
      sellingPrice: Math.max(0.01, Number.parseFloat(String(productForm.sellingPrice)) || 0.01),
      price: Number.parseFloat(String(productForm.sellingPrice)) || 0,
      stock: productForm.stock,
      lowStockThreshold: productForm.lowStockThreshold,
      vendorId: vid,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    if (editingProduct) {
      (productData as any).id = editingProduct.id
    }

    // Electron offline vendors (electron-*, local-*): persist to localStorage so data survives app restart.
    const useElectronLocalInventory = isElectronRuntime && isElectronOfflineInventoryVendorId(activeVendorId)

    if (useElectronLocalInventory) {
      const storedProducts = safeLocalStorageGet<InventoryProduct[]>('electron-inventory', [])
      
      if (editingProduct) {
        const index = storedProducts.findIndex((p: any) => p.id === editingProduct.id)
        if (index >= 0) {
          storedProducts[index] = { ...storedProducts[index], ...productData }
        } else {
          // If the product was imported via XLSX/API and not yet mirrored locally,
          // create a new local copy instead of failing silently.
          storedProducts.push(productData as any)
        }
      } else {
        storedProducts.push(productData as any)
      }
      
      if (!safeLocalStorageSet('electron-inventory', storedProducts)) {
        throw new Error('Failed to save product to localStorage')
      }
      
      setProducts(storedProducts)
      setLowStockProducts(storedProducts.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
      setProductForm({
        sku: "", name: "", category: "", description: "", supplierId: "",
        costPrice: "", sellingPrice: "", price: "", stock: 0, lowStockThreshold: 0, barcode: "", image: ""
      })
      setEditingProduct(null)
      setShowProductDialog(false)
      toast({
        title: editingProduct ? translate("Produit mis à jour", "تم تحديث المنتج") : translate("Produit ajouté", "تمت إضافة المنتج"),
        description: translate("Sauvegardé localement", "تم الحفظ محلياً"),
      })
      return
    }

    // Web or Electron with local vendor: use API
    const method = editingProduct ? "PUT" : "POST"
    const inventoryUrl = `/api/erp/inventory${vid ? `?vendorId=${vid}` : ""}`
    const payload = method === 'PUT' ? productData : (() => { const { id: _id, ...rest } = productData as any; return rest; })()
    const response = await safeFetch(inventoryUrl, {
      method,
      body: JSON.stringify(payload),
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      // Reset form first
      setProductForm({
        sku: "",
        name: "",
        category: "",
        description: "",
        supplierId: "",
        costPrice: "",
        sellingPrice: "",
        price: "",
        stock: 0,
        lowStockThreshold: 0,
        barcode: "",
        image: ""
      })
      setEditingProduct(null)
      setShowProductDialog(false)
      
      // Refresh data
      await refreshInventory(vid)
      await refreshDashboard(vid)
      const updatedProducts = await refreshProducts(vid)
      if (updatedProducts) {
        setProducts(updatedProducts)
        setLowStockProducts(updatedProducts.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
      }
      
      toast({
        title: editingProduct
          ? translate("Produit mis à jour", "تم تحديث المنتج")
          : translate("Produit ajouté", "تمت إضافة المنتج"),
        description: translate("L'inventaire a été mis à jour avec succès", "تم تحديث المخزون بنجاح"),
      })
    } else {
      const apiError = new APIError(
        data.error?.message || translate("Impossible d'ajouter le produit", "تعذر إضافة المنتج"),
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
        fr: "Une erreur est survenue lors de la sauvegarde du produit",
        ar: "حدث خطأ أثناء حفظ المنتج"
      }
    })
  }
}

interface DeleteProductParams {
  id: number | string
  activeVendorId?: string
  isElectronRuntime: boolean
  setProducts: (products: InventoryProduct[]) => void
  setLowStockProducts: (products: InventoryProduct[]) => void
  fetchInventory: (vendorId?: string) => Promise<any>
  fetchDashboardData: (vendorId?: string) => Promise<any>
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
}

export async function deleteProduct({
  id,
  activeVendorId,
  isElectronRuntime,
  setProducts,
  setLowStockProducts,
  fetchInventory,
  fetchDashboardData,
  toast,
  translate,
}: DeleteProductParams) {
  try {
    const vid = activeVendorId ?? ''
    const useElectronLocalInventory = isElectronRuntime && isElectronOfflineInventoryVendorId(activeVendorId)
    if (useElectronLocalInventory) {
      const storedProducts = safeLocalStorageGet<InventoryProduct[]>('electron-inventory', [])
      const filtered = storedProducts.filter((p: any) => p.id !== id)
      if (!safeLocalStorageSet('electron-inventory', filtered)) {
        throw new Error('Failed to delete product from localStorage')
      }
      setProducts(filtered)
      setLowStockProducts(filtered.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
      toast({
        title: translate("Produit supprimé", "تم حذف المنتج"),
        description: translate("Le produit a été supprimé de l'inventaire", "تم حذف المنتج من المخزون"),
      })
      return
    }

    const params = new URLSearchParams()
    params.set('id', String(id))
    if (activeVendorId) params.set('vendorId', activeVendorId)
    const response = await safeFetch(`/api/erp/inventory?${params.toString()}`, {
      method: "DELETE",
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      const { products: nextProducts } = await fetchInventory(activeVendorId)
      if (Array.isArray(nextProducts)) {
        setProducts(nextProducts)
        setLowStockProducts(nextProducts.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
      }
      await fetchDashboardData(activeVendorId)
      toast({
        title: translate("Produit supprimé", "تم حذف المنتج"),
        description: translate("Le produit a été supprimé avec succès", "تم حذف المنتج بنجاح"),
      })
    } else {
      const apiError = new APIError(
        data.error?.message || translate("Impossible de supprimer le produit", "تعذر حذف المنتج"),
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
        fr: "Une erreur est survenue lors de la suppression du produit",
        ar: "حدث خطأ أثناء حذف المنتج"
      }
    })
  }
}

interface PostProductToDeliveryParams {
  inventoryProductId: string | number
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
  playSuccessSound: () => void
}

export async function postProductToDelivery({
  inventoryProductId,
  toast,
  translate,
  playSuccessSound,
}: PostProductToDeliveryParams) {
  try {
    const response = await fetch(`/api/erp/inventory/${String(inventoryProductId)}/post-to-delivery`, {
      method: "POST",
    })
    const data = await response.json()
    if (data.success) {
      toast({
        title: translate("Produit publié", "تم نشر المنتج"),
        description: translate("Le produit est maintenant visible dans l'application client", "المنتج الآن مرئي في تطبيق العميل"),
      })
      playSuccessSound()
    } else {
      toast({
        title: translate("Erreur", "خطأ"),
        description: data.error?.message || translate("Impossible de publier le produit", "تعذر نشر المنتج"),
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("[v0] Error posting product to delivery:", error)
    toast({
      title: translate("Erreur", "خطأ"),
      description: error instanceof Error ? error.message : translate("Une erreur est survenue", "حدث خطأ"),
      variant: "destructive",
    })
  }
}

