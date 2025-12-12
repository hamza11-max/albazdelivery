"use client"

import { useState } from "react"
import { Search, ScanLine, Package, ShoppingCart, X, CheckCircle2, RotateCcw, LogOut, Plus, PlusCircle } from "lucide-react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent } from "@/root/components/ui/card"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import { Badge } from "@/root/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import type { InventoryProduct, Category } from "../app/vendor/types"
import type { CartItem } from "../app/vendor/types"

interface POSViewProps {
  products: InventoryProduct[]
  categories: Category[]
  posCart: CartItem[]
  posSearch: string
  posSelectedCategory: string
  posOrderNumber: string
  posDiscount: number
  posDiscountPercent: number
  posTaxPercent: number
  posKeypadValue: string
  cartSubtotal: number
  cartTax: number
  cartTotal: number
  manualTotal: number | null
  isBarcodeDetectorSupported: boolean
  isArabic: boolean
  translate: (fr: string, ar: string) => string
  onSearchChange: (value: string) => void
  onCategoryChange: (category: string) => void
  onBarcodeScan: () => void
  onAddToCart: (product: InventoryProduct) => void
  onRemoveFromCart: (id: number) => void
  onDiscountPercentChange: (value: number) => void
  onTaxPercentChange: (value: number) => void
  onKeypadKey: (key: string) => void
  onClearDiscount: () => void
  onClearCart: () => void
  onManualTotalChange: (value: number | null) => void
  onAddCustomItem: (name: string, price: number) => void
  onCompleteSale: (paymentMethod: "cash" | "card") => void
}

export function POSView({
  products,
  categories,
  posCart,
  posSearch,
  posSelectedCategory,
  posOrderNumber,
  posDiscount,
  posDiscountPercent,
  posTaxPercent,
  posKeypadValue,
  cartSubtotal,
  cartTax,
  cartTotal,
  manualTotal,
  isBarcodeDetectorSupported,
  isArabic,
  translate,
  onSearchChange,
  onCategoryChange,
  onBarcodeScan,
  onAddToCart,
  onRemoveFromCart,
  onDiscountPercentChange,
  onTaxPercentChange,
  onKeypadKey,
  onClearDiscount,
  onClearCart,
  onManualTotalChange,
  onAddCustomItem,
  onCompleteSale,
}: POSViewProps) {
  const [showCustomItemDialog, setShowCustomItemDialog] = useState(false)
  const [customItemName, setCustomItemName] = useState("")
  const [customItemPrice, setCustomItemPrice] = useState("")
  const [customItemKeypadValue, setCustomItemKeypadValue] = useState("")

  const handleCustomItemKeypadKey = (key: string) => {
    let newValue: string
    if (key === "⌫") {
      newValue = customItemKeypadValue.slice(0, -1)
    } else {
      newValue = customItemKeypadValue + key
    }
    setCustomItemKeypadValue(newValue)
    setCustomItemPrice(newValue)
  }

  const handleAddCustomItem = () => {
    const price = parseFloat(customItemPrice) || 0
    if (customItemName.trim() && price > 0) {
      onAddCustomItem(customItemName.trim(), price)
      setCustomItemName("")
      setCustomItemPrice("")
      setCustomItemKeypadValue("")
      setShowCustomItemDialog(false)
    }
  }
  return (
    <div className={`flex flex-col lg:flex-row min-h-[calc(100vh-120px)] w-full bg-albaz-bg-gradient dark:bg-albaz-bg-gradient-dark gap-4 lg:gap-6 items-start ${isArabic ? 'lg:flex-row-reverse' : ''}`}>
      {/* Products Area - Left Side (2/3 width) */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-2/3">
        {/* Product Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 flex flex-col overflow-hidden p-3 md:p-6 min-w-0 gap-4 md:gap-6">
            {/* Prominent Total Display */}
            <div className="rounded-xl border-2 border-albaz-orange-500 bg-black text-red-500 px-4 sm:px-6 py-4 sm:py-6 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xl sm:text-2xl font-semibold text-white">
                  {translate("Montant total", "المبلغ الإجمالي")}
                </span>
                <span className="text-3xl sm:text-5xl font-mono font-bold tracking-tight">
                  {(manualTotal !== null ? manualTotal : cartTotal).toFixed(3)} {translate("DZD", "دج")}
                </span>
              </div>
            </div>

            {/* Search and Barcode */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className={`absolute ${isArabic ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
                <Input
                  placeholder={translate("Rechercher un produit...", "ابحث عن منتج...")}
                  value={posSearch}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className={`${isArabic ? "pr-10 text-right" : "pl-10"} bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 h-12`}
                />
              </div>
              <Button
                onClick={onBarcodeScan}
                disabled={!isBarcodeDetectorSupported}
                className="bg-albaz-green-gradient hover:opacity-90 text-white shadow-albaz-green w-full sm:w-auto h-12"
              >
                <ScanLine className="w-4 h-4 mr-2" />
                <span className="sm:inline">{translate("Scanner", "مسح")}</span>
              </Button>
            </div>

            {/* Category Filter Bar */}
            <div className="pb-2">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => onCategoryChange("all")}
                  className={`px-6 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    posSelectedCategory === "all"
                      ? "bg-albaz-orange-gradient text-white albaz-glow-orange shadow-albaz-orange"
                      : "bg-white dark:bg-gray-800 text-albaz-green-700 dark:text-albaz-green-300 border border-gray-200 dark:border-gray-700 hover:border-albaz-orange-400"
                  }`}
                >
                  {translate("Tous", "الكل")} ({products.length})
                </button>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.name).length
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onCategoryChange(cat.name)}
                      className={`px-6 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                        posSelectedCategory === cat.name
                          ? "bg-albaz-orange-gradient text-white albaz-glow-orange shadow-albaz-orange"
                          : "bg-white dark:bg-gray-800 text-albaz-green-700 dark:text-albaz-green-300 border border-gray-200 dark:border-gray-700 hover:border-albaz-orange-400"
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto min-w-0">
              <h3 className="text-lg font-semibold text-albaz-green-700 dark:text-albaz-green-300 mb-4">
                {translate("Choisir des produits", "اختر المنتجات")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {products
                  .filter(
                    (p) =>
                      p.stock > 0 &&
                      (posSelectedCategory === "all" || p.category === posSelectedCategory) &&
                      (p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(posSearch.toLowerCase()) ||
                        p.barcode?.includes(posSearch)),
                  )
                  .map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700 hover:border-albaz-orange-400 group"
                      onClick={() => onAddToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          ) : (
                            <Package className="w-12 h-12 text-gray-400" />
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-albaz-orange-gradient flex items-center justify-center text-white albaz-glow-orange">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {translate("Code", "رمز")}: {product.sku}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-albaz-green-700 dark:text-albaz-green-300">
                            {product.sellingPrice} {translate("DZD", "دج")}
                          </p>
                          <Badge variant="secondary" className="bg-albaz-green-100 dark:bg-albaz-green-900 text-albaz-green-700 dark:text-albaz-green-300">
                            {translate("Disponible", "متوفر")}: {product.stock}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart and Keyboard Panel - Right Side (1/3 width) */}
      <div className={`w-full lg:w-1/3 bg-white dark:bg-gray-900 border-t lg:border-t-0 ${isArabic ? 'lg:border-r' : 'lg:border-l'} border-gray-200 dark:border-gray-800 flex flex-col shadow-xl lg:sticky lg:top-0 self-start`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-albaz-green-700 dark:text-albaz-green-300">
              {translate("Résumé de la commande", "ملخص الطلب")}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomItemDialog(true)}
              className="h-8 px-3 text-xs"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              {translate("Article personnalisé", "عنصر مخصص")}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {translate("Commande N°", "طلب رقم")}: <span className="font-mono font-semibold">{posOrderNumber}</span>
          </p>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {posCart.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.productName}</p>
                {item.productId < 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {translate("Article personnalisé", "عنصر مخصص")}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {translate("Quantité", "الكمية")}: {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-albaz-green-700 dark:text-albaz-green-300">
                  {(item.price * item.quantity).toFixed(2)} {translate("DZD", "دج")}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onRemoveFromCart(item.productId)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {posCart.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{translate("Panier vide", "السلة فارغة")}</p>
            </div>
          )}
        </div>

        {/* Order Summary Totals */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{translate("Sous-total", "المجموع الفرعي")}:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{cartSubtotal.toFixed(2)} {translate("DZD", "دج")}</span>
          </div>
          <div className="flex items-center justify-between text-sm gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-gray-600 dark:text-gray-400">{translate("Remise", "الخصم")}:</span>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={posDiscountPercent}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  onDiscountPercentChange(value)
                }}
                className="w-16 h-7 text-xs px-2 py-0"
              />
              <span className="text-gray-600 dark:text-gray-400">%</span>
            </div>
            <span className="font-semibold text-red-600 dark:text-red-400">-{posDiscount.toFixed(2)} {translate("DZD", "دج")}</span>
          </div>
          <div className="flex items-center justify-between text-sm gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">{translate("Montant total", "المبلغ الإجمالي")}:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={manualTotal !== null ? manualTotal.toFixed(2) : cartTotal.toFixed(2)}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseFloat(e.target.value) || 0
                  onManualTotalChange(value)
                }}
                className="w-24 h-8 text-sm px-2 py-0 text-right font-semibold"
                placeholder={cartTotal.toFixed(2)}
              />
              <span className="text-gray-600 dark:text-gray-400">{translate("DZD", "دج")}</span>
            </div>
          </div>
          {manualTotal !== null && manualTotal !== cartTotal && (
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
              <span>{translate("Calculé", "محسوب")}:</span>
              <span>{cartTotal.toFixed(2)} {translate("DZD", "دج")}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 md:p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-12 md:h-14 text-sm md:text-base border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClearCart}
            >
              <X className="w-5 h-5 mr-2" />
              {translate("Annuler", "إلغاء")}
            </Button>
            <Button
              className="h-12 md:h-14 bg-albaz-green-gradient hover:opacity-90 text-white font-bold text-sm md:text-lg"
              onClick={() => onCompleteSale("cash")}
              disabled={posCart.length === 0}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {translate("Confirmer", "تأكيد")}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-albaz-green-300 dark:border-albaz-green-700 text-albaz-green-700 dark:text-albaz-green-300 hover:bg-albaz-green-50 dark:hover:bg-albaz-green-900/20"
              onClick={onClearCart}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {translate("Remboursement", "استرداد")}
            </Button>
            <Button
              variant="outline"
              className="border-albaz-green-300 dark:border-albaz-green-700 text-albaz-green-700 dark:text-albaz-green-300 hover:bg-albaz-green-50 dark:hover:bg-albaz-green-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {translate("Terminer la session", "إنهاء الجلسة")}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Item Dialog */}
      <Dialog open={showCustomItemDialog} onOpenChange={setShowCustomItemDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("Ajouter un article personnalisé", "إضافة عنصر مخصص")}</DialogTitle>
            <DialogDescription>
              {translate("Ajoutez un article qui n'est pas dans l'inventaire", "أضف عنصراً غير موجود في المخزون")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-item-name">{translate("Nom de l'article", "اسم العنصر")}</Label>
              <Input
                id="custom-item-name"
                placeholder={translate("Ex: Service spécial", "مثال: خدمة خاصة")}
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                autoFocus
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-item-price">{translate("Prix", "السعر")} ({translate("DZD", "دج")})</Label>
              <Input
                id="custom-item-price"
                type="text"
                placeholder="0.00"
                value={customItemPrice}
                onChange={(e) => {
                  setCustomItemPrice(e.target.value)
                  setCustomItemKeypadValue(e.target.value)
                }}
                className="bg-white dark:bg-gray-800 text-right font-mono text-lg"
                readOnly
              />
            </div>
            
            {/* Numeric Keyboard */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="lg"
                    className={`h-12 text-xl font-mono bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      key === "⌫" ? "col-span-1" : ""
                    }`}
                    onClick={() => handleCustomItemKeypadKey(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-10 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                  onClick={() => {
                    setCustomItemPrice("")
                    setCustomItemKeypadValue("")
                  }}
                >
                  {translate("Effacer", "مسح")}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCustomItemDialog(false)
              setCustomItemName("")
              setCustomItemPrice("")
              setCustomItemKeypadValue("")
            }}>
              {translate("Annuler", "إلغاء")}
            </Button>
            <Button onClick={handleAddCustomItem} disabled={!customItemName.trim() || parseFloat(customItemPrice) <= 0}>
              {translate("Ajouter", "إضافة")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

