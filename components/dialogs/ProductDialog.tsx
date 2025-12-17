"use client"

import { X, ScanLine, Loader2, Printer } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import type { ProductForm, InventoryProduct } from "../../app/vendor/types"
import type { ChangeEvent } from "react"
import { useState } from "react"
import { BarcodeScannerDialog } from "./BarcodeScannerDialog"
import { useProductBarcodeScanner } from "@/hooks/useProductBarcodeScanner"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productForm: ProductForm
  onFormChange: (form: ProductForm) => void
  editingProduct: InventoryProduct | null
  onSave: () => void
  onFileUpload?: (event: ChangeEvent<HTMLInputElement>) => void
  translate?: (fr: string, ar: string) => string
}

export function ProductDialog({
  open,
  onOpenChange,
  productForm,
  onFormChange,
  editingProduct,
  onSave,
  onFileUpload,
  translate = (fr: string) => fr,
}: ProductDialogProps) {
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false)
  const [isFetchingProduct, setIsFetchingProduct] = useState(false)

  // Fetch product details from external API when barcode is scanned
  const fetchProductFromBarcode = async (barcode: string) => {
    if (!barcode || barcode.length < 8) return

    setIsFetchingProduct(true)
    try {
      const response = await fetch(`/api/products/lookup?barcode=${encodeURIComponent(barcode)}`)
      const data = await response.json()

      if (response.ok && data.product) {
        const product = data.product
        onFormChange({
          ...productForm,
          barcode: barcode,
          name: product.name || productForm.name || '',
          category: product.category || product.categories || productForm.category || '',
          description: product.description || product.ingredients_text || productForm.description || '',
          image: product.image || product.image_url || productForm.image || '',
          sellingPrice: product.price ? product.price.toString() : productForm.sellingPrice,
        })
      } else {
        // Barcode not found, keep manual entry
        onFormChange({
          ...productForm,
          barcode: barcode,
        })
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      // On error, just set the barcode and allow manual entry
      onFormChange({
        ...productForm,
        barcode: barcode,
      })
    } finally {
      setIsFetchingProduct(false)
    }
  }

  // Handle barcode scan
  const handleBarcodeScanned = (barcode: string) => {
    fetchProductFromBarcode(barcode)
    setIsBarcodeScannerOpen(false)
  }

  // Barcode scanner hook
  const { videoRef: barcodeVideoRef, error: barcodeScannerError } = useProductBarcodeScanner({
    isOpen: isBarcodeScannerOpen,
    onBarcodeScanned: handleBarcodeScanned,
    onError: (error) => console.error('Barcode scanner error:', error),
  })

  // Start barcode scanner
  const startBarcodeScanner = async () => {
    setIsBarcodeScannerOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{editingProduct ? translate("Modifier le Produit", "تعديل المنتج") : translate("Ajouter un Produit", "إضافة منتج")}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? translate("Modifiez les informations du produit", "قم بتعديل معلومات المنتج")
                : translate("Remplissez les informations pour ajouter un nouveau produit à l'inventaire", "املأ المعلومات لإضافة منتج جديد إلى المخزون")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={productForm.sku}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange({ ...productForm, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nom du Produit</Label>
              <Input
                value={productForm.name}
                onChange={(e) => onFormChange({ ...productForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input
                value={productForm.category}
                onChange={(e) => onFormChange({ ...productForm, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{translate("Code-barres", "الرمز الشريطي")}</span>
                {!editingProduct && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startBarcodeScanner}
                    className="h-7 px-2"
                  >
                    <ScanLine className="w-4 h-4 mr-1" />
                    {translate("Scanner", "مسح")}
                  </Button>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={productForm.barcode}
                  onChange={(e) => onFormChange({ ...productForm, barcode: e.target.value })}
                  placeholder={translate("EAN/UPC ou scanner", "EAN/UPC أو مسح")}
                />
                {isFetchingProduct && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary self-center" />
                )}
              </div>
              {productForm.barcode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchProductFromBarcode(productForm.barcode)}
                  disabled={isFetchingProduct}
                  className="text-xs"
                >
                  {translate("Rechercher les détails", "البحث عن التفاصيل")}
                </Button>
              )}
            </div>
          <div className="space-y-2">
            <Label>Prix Coût (DZD)</Label>
            <Input
              type="number"
              value={productForm.costPrice}
              onChange={(e) => onFormChange({ ...productForm, costPrice: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Prix Vente (DZD)</Label>
            <Input
              type="number"
              value={productForm.sellingPrice}
              onChange={(e) => onFormChange({ ...productForm, sellingPrice: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Stock Initial</Label>
            <Input
              type="number"
              value={productForm.stock}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange({ ...productForm, stock: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Seuil Stock Faible</Label>
            <Input
              type="number"
              value={productForm.lowStockThreshold}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange({ ...productForm, lowStockThreshold: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>{translate("Photo du Produit", "صورة المنتج")}</Label>
            <div className="flex items-center gap-3">
              {onFileUpload ? (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onFileUpload}
                  className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-albaz-green-50 file:text-albaz-green-700 hover:file:bg-albaz-green-100 dark:file:bg-albaz-green-900/30 dark:file:text-albaz-green-300"
                />
              ) : (
                <Input
                  type="url"
                  placeholder="https://exemple.com/produit.jpg ou /placeholder.jpg"
                  value={productForm.image}
                  onChange={(e) => onFormChange({ ...productForm, image: e.target.value })}
                />
              )}
              {productForm.image && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onFormChange({ ...productForm, image: "" })}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  {translate("Supprimer", "حذف")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {translate(
                "Téléchargez une image du produit. Cette photo sera visible dans l'inventaire et pour les clients.",
                "قم بتحميل صورة المنتج. ستكون هذه الصورة مرئية في المخزون وللعملاء."
              )}
            </p>
            {productForm.image && (
              <div className="mt-2">
                <img
                  src={productForm.image}
                  alt={translate("Aperçu", "معاينة")}
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.jpg'
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {productForm.barcode && (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  // Print barcode
                  try {
                    const response = await fetch(`/api/products/barcode/print?barcode=${encodeURIComponent(productForm.barcode)}&name=${encodeURIComponent(productForm.name || 'Product')}`)
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `barcode-${productForm.barcode}.pdf`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      window.URL.revokeObjectURL(url)
                    }
                  } catch (error) {
                    console.error('Error printing barcode:', error)
                  }
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                {translate("Imprimer Code-barres", "طباعة الرمز الشريطي")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {translate("Annuler", "إلغاء")}
            </Button>
            <Button onClick={onSave}>{translate("Enregistrer", "حفظ")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Barcode Scanner Dialog */}
    <BarcodeScannerDialog
      open={isBarcodeScannerOpen}
      onOpenChange={setIsBarcodeScannerOpen}
      videoRef={barcodeVideoRef}
      error={barcodeScannerError}
      translate={translate}
      onBarcodeScanned={handleBarcodeScanned}
    />
    </>
  )
}

