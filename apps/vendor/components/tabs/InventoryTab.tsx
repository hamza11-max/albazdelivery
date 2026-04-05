"use client"

import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/root/components/ui/table"
import { Badge } from "@/root/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/root/components/ui/tabs"
import { Edit, Upload, Send, Trash2, Plus, RotateCcw, Package, Tag } from "lucide-react"
import type { InventoryProduct } from "@/root/lib/types"
import { isElectronOfflineInventoryVendorId } from "@/utils/electronUtils"
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
  handleDeleteProduct: (id: number | string) => Promise<void>
  onPrintLabels?: (products: InventoryProduct[]) => void | Promise<void>
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
  onPrintLabels,
}: InventoryTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6 -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">
          {translate("Gestion de l'inventaire", "إدارة المخزون")}
        </h2>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">
            {translate("Produits", "المنتجات")}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            {translate("Alertes stock", "تنبيهات المخزون")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4 sm:space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={async () => {
                // Pure offline Electron (electron-vendor): load from localStorage
                const vid = activeVendorId ?? ''
                if (isElectronRuntime && isElectronOfflineInventoryVendorId(vid)) {
                  const storedProducts = JSON.parse(localStorage.getItem('electron-inventory') || '[]')
                  setProducts(storedProducts)
                  setLowStockProducts(storedProducts.filter((p: any) => p.stock <= (p.lowStockThreshold ?? 10)))
                  toast({ title: translate("Actualisé", "تم التحديث"), description: translate("Inventaire actualisé", "تم تحديث المخزون") })
                  return
                }
                const updatedProducts = await fetchProducts(activeVendorId)
                if (updatedProducts) {
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
                  const isElectron = typeof window !== "undefined" && (window as any).electronAPI?.isElectron
                  const isElectronVendor = isElectron && isElectronOfflineInventoryVendorId(activeVendorId)

                  const ExcelJS = (await import('exceljs')).default
                  const data = await file.arrayBuffer()
                  const workbook = new ExcelJS.Workbook()
                  await workbook.xlsx.load(data)
                  const sheet = workbook.worksheets[0]
                  if (!sheet) throw new Error('No sheet')

                  // Normalize ExcelJS cell value to primitive (formula/date/richText are objects)
                  const cellToPrimitive = (v: unknown): string | number | boolean | null | undefined => {
                    if (v == null) return v
                    if (typeof v === 'object' && v !== null && 'result' in v) return (v as { result: unknown }).result as string | number | boolean
                    if (v instanceof Date) return v.getTime()
                    if (typeof v === 'object' && v !== null && 'richText' in v) {
                      const rt = (v as { richText: Array<{ text?: string }> }).richText
                      return rt?.map((t) => t.text ?? '').join('') || ''
                    }
                    return v as string | number | boolean
                  }

                  // Normalize header to canonical field name (case-insensitive, trim, map French/English)
                  // Covers common "inventaire.xlsx" columns: Code, Désignation, Catégorie, Prix d'achat, Prix de vente, Stock, etc.
                  const headerToField: Record<string, string> = {
                    sku: 'sku', code: 'sku', ref: 'sku', reference: 'sku', 'code produit': 'sku', 'code article': 'sku', reference: 'sku',
                    name: 'name', nom: 'name', productname: 'name', produit: 'name', 'nom du produit': 'name', product: 'name',
                    designation: 'name', libellé: 'name', libelle: 'name', 'nom produit': 'name', article: 'name', désignation: 'name',
                    category: 'category', categorie: 'category', cat: 'category', type: 'category', famille: 'category',
                    costprice: 'costPrice', cost: 'costPrice', 'prix cout': 'costPrice', 'prix_cout': 'costPrice', 'coût': 'costPrice', 'cout': 'costPrice',
                    'prix d\'achat': 'costPrice', 'prix d achat': 'costPrice', pa: 'costPrice', 'coût unitaire': 'costPrice', 'cout unitaire': 'costPrice',
                    sellingprice: 'sellingPrice', price: 'sellingPrice', prix: 'sellingPrice', 'prix vente': 'sellingPrice', 'prix_vente': 'sellingPrice', 'vente': 'sellingPrice',
                    'prix de vente': 'sellingPrice', pv: 'sellingPrice', 'prix unitaire': 'sellingPrice',
                    stock: 'stock', quantity: 'stock', quantite: 'stock', qty: 'stock', qté: 'stock', qte: 'stock',
                    lowstockthreshold: 'lowStockThreshold', threshold: 'lowStockThreshold', seuil: 'lowStockThreshold',
                    'seuil minimum': 'lowStockThreshold', 'stock minimum': 'lowStockThreshold',
                    barcode: 'barcode', codebarre: 'barcode', ean: 'barcode', 'code barres': 'barcode', 'code-barres': 'barcode',
                  }
                  const normalize = (s: string) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
                  const getField = (header: string) => headerToField[normalize(header)] || null

                  const headers: string[] = []
                  const jsonData: Record<string, unknown>[] = []
                  sheet.eachRow((row, rowNumber) => {
                    const values: (string | number | boolean | null | undefined)[] = []
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                      values[colNumber - 1] = cellToPrimitive(cell.value)
                    })
                    if (rowNumber === 1) {
                      headers.push(...values.map((v) => String(v ?? '').trim()))
                    } else {
                      const obj: Record<string, unknown> = {}
                      headers.forEach((h, i) => {
                        const field = getField(h)
                        if (field) obj[field] = values[i]
                        else obj[h] = values[i]
                      })
                      jsonData.push(obj)
                    }
                  })

                  const parseNum = (v: unknown): number => {
                    if (v == null || v === '') return 0
                    if (typeof v === 'number') return Number.isFinite(v) ? v : 0
                    const s = String(v).trim().replace(/\s/g, '').replace(',', '.')
                    const n = parseFloat(s)
                    return Number.isFinite(n) ? n : 0
                  }
                  const parseIntSafe = (v: unknown): number => {
                    const n = parseNum(v)
                    return Math.max(0, Math.floor(n))
                  }

                  let imported = 0
                  let failed = 0
                  const newProducts: InventoryProduct[] = isElectronVendor ? JSON.parse(localStorage.getItem("electron-inventory") || "[]") : []

                  for (let idx = 0; idx < jsonData.length; idx++) {
                    const row = jsonData[idx] as Record<string, unknown>
                    const skuRaw = row.sku ?? row.SKU ?? ''
                    let nameRaw = row.name ?? row.Nom ?? row.designation ?? ''
                    if (!String(nameRaw).trim()) {
                      const firstNonEmpty = Object.values(row).find((v) => v != null && String(v).trim())
                      nameRaw = firstNonEmpty ?? ''
                    }
                    const name = String(nameRaw).trim() || `Produit ${idx + 1}`
                    const costPrice = parseNum(row.costPrice ?? row.cost)
                    const sellingPrice = parseNum(row.sellingPrice ?? row.price ?? row.prix)
                    const baseProduct = {
                      sku: String(skuRaw).trim() || `SKU-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
                      name: name.length >= 2 ? name : `${name} `.trim(),
                      category: String(row.category ?? row.Category ?? '').trim() || 'General',
                      costPrice: costPrice > 0 ? costPrice : 0.01,
                      sellingPrice: sellingPrice > 0 ? sellingPrice : 0.01,
                      stock: parseIntSafe(row.stock ?? row.quantity),
                      lowStockThreshold: parseIntSafe(row.lowStockThreshold ?? row.threshold ?? 10),
                      barcode: String(row.barcode ?? row.Barcode ?? '').trim(),
                    }

                    if (isElectronVendor) {
                      // Pure offline Electron: import directly into localStorage-backed inventory
                      const localProduct: any = {
                        ...baseProduct,
                        id: `local-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
                        vendorId: activeVendorId ?? "electron-vendor",
                        price: baseProduct.sellingPrice,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }
                      newProducts.push(localProduct)
                      imported++
                    } else {
                      const productData = {
                        ...baseProduct,
                        vendorId: activeVendorId,
                      }
                      const response = await fetch(`/api/erp/inventory${activeVendorId ? `?vendorId=${activeVendorId}` : ''}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productData),
                      })
                      
                      if (response.ok) imported++
                      else {
                        failed++
                        const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
                        const msg = (err as { error?: { message?: string }; message?: string })?.error?.message ?? (err as { message?: string })?.message ?? `HTTP ${response.status}`
                        console.warn('Import row failed:', productData.name ?? productData.sku, msg)
                      }
                    }
                  }

                  if (isElectronVendor) {
                    localStorage.setItem("electron-inventory", JSON.stringify(newProducts))
                    setProducts(newProducts)
                    setLowStockProducts(newProducts.filter((p: any) => p.stock <= (p.lowStockThreshold ?? 10)))
                  } else {
                    const updatedProducts = await fetchProducts(activeVendorId)
                    if (updatedProducts) {
                      setProducts(updatedProducts)
                      setLowStockProducts(updatedProducts.filter((p: InventoryProduct) => p.stock <= (p.lowStockThreshold ?? 10)))
                    }
                  }
                  
                  const desc = failed > 0
                    ? translate(`${imported} importés, ${failed} échecs`, `تم استيراد ${imported}، فشل ${failed}`)
                    : translate(`${imported} produits importés`, `تم استيراد ${imported} منتج`)
                  toast({
                    title: failed > 0 ? translate("Import partiel", "استيراد جزئي") : translate("Import réussi", "تم الاستيراد"),
                    description: desc,
                    variant: failed > 0 ? "destructive" : "default",
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
                            const cost = product.costPrice ?? product.cost ?? 0
                            const selling = product.sellingPrice ?? product.price ?? 0
                            setProductForm({
                              sku: product.sku ?? '',
                              name: product.name ?? '',
                              category: product.category ?? '',
                              description: product.description || "",
                              supplierId: product.supplierId?.toString() || "",
                              costPrice: String(cost),
                              sellingPrice: String(selling),
                              price: String(selling),
                              stock: product.stock ?? 0,
                              lowStockThreshold: product.lowStockThreshold ?? 10,
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
                        {onPrintLabels && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPrintLabels([product])}
                            title={translate("Imprimer l'étiquette", "طباعة الملصق")}
                          >
                            <Tag className="w-4 h-4" />
                          </Button>
                        )}
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
        </TabsContent>

        <TabsContent value="alerts">
          <InventoryAlertsTab translate={translate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
