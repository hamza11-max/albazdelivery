"use client"

import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Edit, Upload, Send, Trash2, Plus, RotateCcw, Package } from "lucide-react"
import type { InventoryProduct } from "@/root/lib/types"
import { InventoryAlertsTab } from "./InventoryAlertsTab"

interface InventoryTabProps {
  products: InventoryProduct[]
  isElectronRuntime: boolean
  activeVendorId?: string
  isArabic: boolean
  translate: (fr: string, ar: string) => string
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void
  setProducts: (products: InventoryProduct[]) => void
  setLowStockProducts: (products: InventoryProduct[]) => void
  setShowProductDialog: (show: boolean) => void
  setEditingProduct: (product: InventoryProduct | null) => void
  setProductForm: (form: any) => void
  setSelectedProductForImage: (id: number | string) => void
  setShowImageUploadDialog: (show: boolean) => void
  fetchProducts: (vendorId?: string) => Promise<InventoryProduct[] | null>
  handlePostProductToDelivery: (id: number | string) => Promise<void>
  handleDeleteProduct: (id: number) => Promise<void>
}

export function InventoryTab({
  products,
  isElectronRuntime,
  activeVendorId,
  isArabic,
  translate,
  toast,
  setProducts,
  setLowStockProducts,
  setShowProductDialog,
  setEditingProduct,
  setProductForm,
  setSelectedProductForImage,
  setShowImageUploadDialog,
  fetchProducts,
  handlePostProductToDelivery,
  handleDeleteProduct,
}: InventoryTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">
          {translate("Gestion de l'inventaire", "إدارة المخزون")}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              // For Electron: reload from localStorage
              if (isElectronRuntime) {
                const storedProducts = JSON.parse(localStorage.getItem('electron-inventory') || '[]')
                setProducts(storedProducts)
                setLowStockProducts(storedProducts.filter((p: any) => p.stock <= (p.lowStockThreshold ?? 10)))
                toast({ title: translate("Actualisé", "تم التحديث"), description: translate("Inventaire actualisé", "تم تحديث المخزون") })
                return
              }
              
              const updatedProducts = await fetchProducts(activeVendorId)
              if (updatedProducts && updatedProducts.length > 0) {
                setProducts(updatedProducts)
                setLowStockProducts(updatedProducts.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
              }
              toast({ title: translate("Actualisé", "تم التحديث"), description: translate("Inventaire actualisé", "تم تحديث المخزون") })
            }}
          >
            <RotateCcw className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
            {translate("Actualiser", "تحديث")}
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                
                try {
                  const ExcelJS = (await import('exceljs')).default
                  const data = await file.arrayBuffer()
                  const workbook = new ExcelJS.Workbook()
                  await workbook.xlsx.load(data)
                  const sheet = workbook.worksheets[0]
                  if (!sheet) throw new Error('No sheet')
                  const headers: string[] = []
                  const jsonData: Record<string, unknown>[] = []
                  sheet.eachRow((row, rowNumber) => {
                    const values: (string | number | boolean | null | undefined)[] = []
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                      values[colNumber - 1] = cell.value as string | number | boolean | null | undefined
                    })
                    if (rowNumber === 1) {
                      headers.push(...values.map((v) => String(v ?? '')))
                    } else {
                      const obj: Record<string, unknown> = {}
                      headers.forEach((h, i) => {
                        obj[h] = values[i]
                      })
                      jsonData.push(obj)
                    }
                  })

                  let imported = 0
                  for (const row of jsonData as any[]) {
                    const productData = {
                      sku: row.sku || row.SKU || `SKU-${Date.now()}`,
                      name: row.name || row.Name || row.nom || row.Nom || 'Unknown',
                      category: row.category || row.Category || row.categorie || '',
                      costPrice: parseFloat(row.costPrice || row.cost || row.prix_cout || 0),
                      sellingPrice: parseFloat(row.sellingPrice || row.price || row.prix || row.prix_vente || 0),
                      stock: parseInt(row.stock || row.Stock || row.quantity || 0),
                      lowStockThreshold: parseInt(row.lowStockThreshold || row.threshold || 10),
                      barcode: row.barcode || row.Barcode || '',
                      vendorId: activeVendorId,
                    }
                    
                    const response = await fetch(`/api/erp/inventory${activeVendorId ? `?vendorId=${activeVendorId}` : ''}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(productData),
                    })
                    
                    if (response.ok) imported++
                  }
                  
                  const updatedProducts = await fetchProducts(activeVendorId)
                  if (updatedProducts) {
                    setProducts(updatedProducts)
                    setLowStockProducts(updatedProducts.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
                  }
                  
                  toast({
                    title: translate("Import réussi", "تم الاستيراد"),
                    description: translate(`${imported} produits importés`, `تم استيراد ${imported} منتج`),
                  })
                } catch (error) {
                  console.error('Import error:', error)
                  toast({
                    title: translate("Erreur d'import", "خطأ في الاستيراد"),
                    description: translate("Vérifiez le format du fichier", "تحقق من تنسيق الملف"),
                    variant: "destructive",
                  })
                }
                e.target.value = ''
              }}
            />
            <Button variant="outline" asChild>
              <span>
                <Package className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                {translate("Importer XLSX", "استيراد XLSX")}
              </span>
            </Button>
          </label>
          <Button onClick={() => setShowProductDialog(true)}>
            <Plus className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
            {translate("Ajouter un produit", "إضافة منتج")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix Coût</TableHead>
                <TableHead>Prix Vente</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.costPrice} DZD</TableCell>
                  <TableCell className="font-semibold">{product.sellingPrice} DZD</TableCell>
                  <TableCell>
                    <Badge variant={product.stock <= product.lowStockThreshold ? "destructive" : "default"}>
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProduct(product)
                          setProductForm({
                            sku: product.sku,
                            name: product.name,
                            category: product.category,
                            description: product.description || "",
                            supplierId: product.supplierId?.toString() || "",
                            costPrice: product.costPrice.toString(),
                            sellingPrice: product.sellingPrice.toString(),
                            price: product.price.toString(),
                            stock: product.stock,
                            lowStockThreshold: product.lowStockThreshold,
                            barcode: product.barcode || "",
                            image: product.image || ""
                          })
                          setShowProductDialog(true)
                        }}
                        title={translate("Modifier", "تعديل")}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedProductForImage(product.id)
                          setShowImageUploadDialog(true)
                        }}
                        title={translate("Upload Photo", "رفع صورة")}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-albaz-green-600 hover:text-albaz-green-700 dark:text-albaz-green-400"
                        onClick={() => handlePostProductToDelivery(product.id)}
                        title={translate("Post to Delivery", "نشر للتوصيل")}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDeleteProduct(product.id)}
                        title={translate("Supprimer", "حذف")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">
                {translate("Aucun produit dans l'inventaire", "لا توجد منتجات في المخزون")}
              </p>
              <Button onClick={() => setShowProductDialog(true)}>
                <Plus className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                {translate("Ajouter votre premier produit", "أضف أول منتج لك")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertes stock (merged from Alertes page) */}
      <InventoryAlertsTab translate={translate} />
    </div>
  )
}
