"use client"

import type { InventoryProduct, ProductForm } from "../app/vendor/types"
import { fetchInventory, fetchDashboardData, fetchProducts } from "../app/vendor/refresh-data"
import { handleError, safeLocalStorageGet, safeLocalStorageSet, safeFetch, parseAPIResponse, APIError, ValidationError } from "./errorHandling"

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
  toast,
  translate,
}: SaveProductParams) {
  try {
    const productData = {
      ...productForm,
      id: editingProduct?.id || `local-${Date.now()}`,
      costPrice: Number.parseFloat(productForm.costPrice) || 0,
      sellingPrice: Number.parseFloat(productForm.sellingPrice) || 0,
      price: Number.parseFloat(productForm.sellingPrice) || 0,
      stock: productForm.stock,
      lowStockThreshold: productForm.lowStockThreshold,
      vendorId: activeVendorId || 'local-vendor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // For Electron: save to localStorage directly
    if (isElectronRuntime) {
      const storedProducts = safeLocalStorageGet<InventoryProduct[]>('electron-inventory', [])
      
      if (editingProduct) {
        const index = storedProducts.findIndex((p: any) => p.id === editingProduct.id)
        if (index >= 0) {
          storedProducts[index] = { ...storedProducts[index], ...productData }
        } else {
          throw new ValidationError(
            translate("Produit introuvable", "المنتج غير موجود"),
            'productId'
          )
        }
      } else {
        storedProducts.push(productData)
      }
      
      if (!safeLocalStorageSet('electron-inventory', storedProducts)) {
        throw new Error('Failed to save product to localStorage')
      }
      
      // Update state directly
      setProducts(storedProducts)
      setLowStockProducts(storedProducts.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
      
      // Reset form
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
      
      toast({
        title: editingProduct
          ? translate("Produit mis à jour", "تم تحديث المنتج")
          : translate("Produit ajouté", "تمت إضافة المنتج"),
        description: translate("Sauvegardé localement", "تم الحفظ محلياً"),
      })
      return
    }

    // Web version: use API
    const method = editingProduct ? "PUT" : "POST"
    const inventoryUrl = `/api/erp/inventory${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`
    const response = await safeFetch(inventoryUrl, {
      method,
      body: JSON.stringify(productData),
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
      await fetchInventory(activeVendorId)
      await fetchDashboardData(activeVendorId)
      const updatedProducts = await fetchProducts(activeVendorId)
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
  id: number
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
    if (isElectronRuntime) {
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

    const response = await safeFetch(`/api/erp/inventory/${id}${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`, {
      method: "DELETE",
    })
    const data = await parseAPIResponse(response)
    if (data.success) {
      await fetchInventory(activeVendorId)
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

