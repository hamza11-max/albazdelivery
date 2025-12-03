"use client"

import type { ChangeEvent } from "react"
import type { InventoryProduct } from "@/root/lib/types"
import { handleError, safeLocalStorageGet, safeLocalStorageSet, safeFetch, parseAPIResponse, APIError, ValidationError } from "./errorHandling"

interface HandleFileUploadParams {
  event: ChangeEvent<HTMLInputElement>
  selectedProductForImage: number | null
  products: InventoryProduct[]
  isElectronRuntime: boolean
  activeVendorId?: string
  setProducts: (products: InventoryProduct[]) => void
  setLowStockProducts: (products: InventoryProduct[]) => void
  setProductForm: (form: any) => void
  setShowImageUploadDialog: (show: boolean) => void
  setSelectedProductForImage: (id: number | null) => void
  fetchInventory: (vendorId?: string) => Promise<any>
  fetchDashboardData: (vendorId?: string) => Promise<any>
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  translate: (fr: string, ar: string) => string
  fileInputRef: React.RefObject<HTMLInputElement>
}

export async function handleFileUpload({
  event,
  selectedProductForImage,
  products,
  isElectronRuntime,
  activeVendorId,
  setProducts,
  setLowStockProducts,
  setProductForm,
  setShowImageUploadDialog,
  setSelectedProductForImage,
  fetchInventory,
  fetchDashboardData,
  toast,
  translate,
  fileInputRef,
}: HandleFileUploadParams) {
  const file = event.target.files?.[0]
  if (!file) return
  
  // Validate file type
  if (!file.type.startsWith("image/")) {
    const error = new ValidationError(
      translate("Veuillez sélectionner une image valide.", "يرجى اختيار صورة صالحة."),
      'fileType'
    )
    handleError(error, { showToast: true, logError: true, translate, toast })
    return
  }
  
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    const error = new ValidationError(
      translate("L'image est trop grande. Taille maximale: 5MB", "الصورة كبيرة جداً. الحد الأقصى: 5 ميجابايت"),
      'fileSize'
    )
    handleError(error, { showToast: true, logError: true, translate, toast })
    return
  }
  const reader = new FileReader()
  reader.onload = async () => {
    const result = typeof reader.result === "string" ? reader.result : ""
    
    // If a product is selected for image update, update that product
    if (selectedProductForImage) {
      try {
        const product = products.find(p => p.id === selectedProductForImage)
        if (product) {
          // Prepare product data with all required fields, similar to saveProduct
          const productData = {
            id: product.id,
            sku: product.sku || "",
            name: product.name,
            description: product.description || "",
            category: product.category,
            supplierId: product.supplierId?.toString() || "",
            costPrice: product.costPrice?.toString() || "0",
            sellingPrice: product.sellingPrice?.toString() || product.price?.toString() || "0",
            price: product.price?.toString() || product.sellingPrice?.toString() || "0",
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold || 10,
            barcode: product.barcode || "",
            image: result,
            vendorId: activeVendorId || 'local-vendor',
          }
          
          // For Electron: save to localStorage directly
          if (isElectronRuntime) {
            const storedProducts = safeLocalStorageGet<InventoryProduct[]>('electron-inventory', [])
            const index = storedProducts.findIndex((p: any) => p.id === product.id)
            if (index >= 0) {
              storedProducts[index] = { ...storedProducts[index], ...productData, image: result }
              if (!safeLocalStorageSet('electron-inventory', storedProducts)) {
                throw new Error('Failed to update product image in localStorage')
              }
              setProducts(storedProducts)
              setLowStockProducts(storedProducts.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
            }
            toast({
              title: translate("Image mise à jour", "تم تحديث الصورة"),
              description: translate("La photo du produit a été mise à jour.", "تم تحديث صورة المنتج."),
            })
            setShowImageUploadDialog(false)
            setSelectedProductForImage(null)
            return
          }
          
          // Web version: use API
          const inventoryUrl = `/api/erp/inventory${activeVendorId ? `?vendorId=${activeVendorId}` : ""}`
          const response = await safeFetch(inventoryUrl, {
            method: "PUT",
            body: JSON.stringify(productData),
          })
          
          const data = await parseAPIResponse(response)
          if (data.success) {
            // Refresh products list
            await fetchInventory(activeVendorId)
            await fetchDashboardData(activeVendorId)
            toast({
              title: translate("Image mise à jour", "تم تحديث الصورة"),
              description: translate("La photo du produit a été mise à jour.", "تم تحديث صورة المنتج."),
            })
            setShowImageUploadDialog(false)
            setSelectedProductForImage(null)
          } else {
            const apiError = new APIError(
              data.error?.message || data.message || "Failed to update product image",
              response.status,
              data
            )
            throw apiError
          }
        } else {
          throw new ValidationError(
            translate("Produit introuvable", "المنتج غير موجود"),
            'productId'
          )
        }
      } catch (error) {
        handleError(error, {
          showToast: true,
          logError: true,
          translate,
          toast,
          fallbackMessage: {
            fr: "Impossible de mettre à jour l'image du produit",
            ar: "تعذر تحديث صورة المنتج"
          }
        })
      }
    } else {
      // If no product selected, update the form (for new product)
      setProductForm((prev) => ({
        ...prev,
        image: result,
      }))
      toast({
        title: translate("Image importée", "تم استيراد الصورة"),
        description: translate("La photo du produit a été ajoutée.", "تمت إضافة صورة المنتج."),
      })
      setShowImageUploadDialog(false)
    }
  }
  reader.readAsDataURL(file)
  
  // Reset file input
  if (fileInputRef.current) {
    fileInputRef.current.value = ""
  }
}

