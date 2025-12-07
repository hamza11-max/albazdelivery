"use client"

import { useState } from "react"
import { Search, ScanLine, Minus, Plus, Trash2, DollarSign, Package } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Badge } from "@albaz/ui"
import type { InventoryProduct, CartItem } from "../../app/vendor/types"

interface POSTabProps {
  products: InventoryProduct[]
  cart: CartItem[]
  search: string
  discount: number
  translate: (fr: string, ar: string) => string
  isArabic: boolean
  isBarcodeDetectorSupported: boolean
  onSearchChange: (search: string) => void
  onBarcodeScan: () => void
  onAddToCart: (product: InventoryProduct) => void
  onRemoveFromCart: (productId: number) => void
  onUpdateQuantity: (productId: number, delta: number) => void
  onDiscountChange: (discount: number) => void
  onCompleteSale: (paymentMethod: "cash" | "card") => void
}

export function POSTab({
  products,
  cart,
  search,
  discount,
  translate,
  isArabic,
  isBarcodeDetectorSupported,
  onSearchChange,
  onBarcodeScan,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onDiscountChange,
  onCompleteSale,
}: POSTabProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal - discount

  const filteredProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search))
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{translate("Point de Vente", "نقطة البيع")}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`flex ${isArabic ? "flex-row-reverse" : "flex-row"} items-center gap-2`}>
            <div className="relative flex-1">
              <Search
                className={`absolute ${isArabic ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5`}
              />
              <Input
                placeholder={translate(
                  "Rechercher un produit ou scanner un code-barres...",
                  "ابحث عن منتج أو امسح رمزاً شريطياً..."
                )}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`${isArabic ? "pr-10 text-right" : "pl-10"}`}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={onBarcodeScan}
              disabled={!isBarcodeDetectorSupported}
            >
              <ScanLine className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
              {translate("Scanner", "مسح")}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onAddToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-primary">{product.sellingPrice} DZD</p>
                    <Badge variant="secondary">{product.stock}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{translate("Panier", "السلة")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.price} DZD</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => onUpdateQuantity(item.productId, -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => onUpdateQuantity(item.productId, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => onRemoveFromCart(item.productId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {translate("Panier vide", "السلة فارغة")}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{translate("Sous-total:", "المجموع الفرعي:")}</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} DZD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">{translate("Remise:", "الخصم:")}</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => onDiscountChange(Number.parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                  <span className="text-sm">DZD</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>{translate("Total:", "المجموع:")}</span>
                  <span className="text-primary">{total.toFixed(2)} DZD</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => onCompleteSale("cash")}
                  disabled={cart.length === 0}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {translate("Payer en Espèces", "الدفع نقداً")}
                </Button>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => onCompleteSale("card")}
                  disabled={cart.length === 0}
                >
                  {translate("Payer par Carte", "الدفع بالبطاقة")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

