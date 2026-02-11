"use client"

import { X, ScanLine } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Button } from "@/root/components/ui/button"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import type { ProductForm, InventoryProduct } from "../../app/vendor/types"
import type { ChangeEvent } from "react"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productForm: ProductForm
  onFormChange: (form: ProductForm) => void
  editingProduct: InventoryProduct | null
  onSave: () => void
  onFileUpload?: (event: ChangeEvent<HTMLInputElement>) => void
  onScanBarcode?: () => void
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
  onScanBarcode,
  translate = (fr: string) => fr,
}: ProductDialogProps) {
  return (
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
              {onScanBarcode && (
                <Button type="button" variant="outline" size="sm" onClick={onScanBarcode} className="h-7 px-2">
                  <ScanLine className="w-4 h-4 mr-1" />
                  {translate("Scanner", "مسح")}
                </Button>
              )}
            </Label>
            <Input
              value={productForm.barcode}
              onChange={(e) => onFormChange({ ...productForm, barcode: e.target.value })}
              placeholder={translate("EAN/UPC ou scanner", "EAN/UPC أو مسح")}
            />
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {translate("Annuler", "إلغاء")}
          </Button>
          <Button onClick={onSave}>{translate("Enregistrer", "حفظ")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

