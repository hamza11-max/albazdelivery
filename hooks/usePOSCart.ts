import { useState, useMemo, useCallback } from "react"
import type { InventoryProduct } from "@/root/lib/types"
import type { CartItem } from "../app/vendor/types"

let posOrderSequence = 0

function makePosOrderNumber(): string {
  posOrderSequence = (posOrderSequence + 1) % 1000
  return `ORD-${Date.now().toString().slice(-6)}-${posOrderSequence.toString().padStart(3, "0")}`
}

export function usePOSCart() {
  const [posCart, setPosCart] = useState<CartItem[]>([])
  const [posCustomerId, setPosCustomerId] = useState<number | null>(null)
  const [posDiscount, setPosDiscount] = useState(0)
  const [posTax, setPosTax] = useState(0)
  const [posDiscountPercent, setPosDiscountPercent] = useState(5)
  const [posTaxPercent, setPosTaxPercent] = useState(2)
  const [posSelectedCategory, setPosSelectedCategory] = useState<string>("all")
  const [posOrderNumber, setPosOrderNumber] = useState<string>(() => {
    return makePosOrderNumber()
  })
  const [posKeypadValue, setPosKeypadValue] = useState<string>("")
  const [posSearch, setPosSearch] = useState("")

  const cartSubtotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [posCart])

  const addToCart = useCallback((product: InventoryProduct) => {
    setPosCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id)
      if (existing) {
        return prevCart.map((item) => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: product.sellingPrice || 0,
            discount: 0,
          },
        ]
      }
    })
  }, [])

  const addCustomItemToCart = useCallback((name: string, price: number) => {
    const customId = -Date.now() // Use negative timestamp for custom items
    setPosCart((prevCart) => [
      ...prevCart,
      {
        id: customId,
        productId: customId,
        productName: name,
        quantity: 1,
        price: price,
        discount: 0,
      },
    ])
  }, [])

  const removeFromCart = useCallback((id: number | string) => {
    setPosCart((prev) => prev.filter((item) => String(item.id) !== String(id)))
  }, [])

  const updateCartQuantity = useCallback((productId: number | string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((item) =>
          String(item.productId) === String(productId)
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }, [])

  const clearCart = useCallback(() => {
    setPosCart([])
    setPosDiscount(0)
    setPosDiscountPercent(0)
    setPosKeypadValue("")
    setPosOrderNumber(makePosOrderNumber())
  }, [])

  return {
    // State
    posCart,
    posCustomerId,
    posDiscount,
    posTax,
    posDiscountPercent,
    posTaxPercent,
    posSelectedCategory,
    posOrderNumber,
    posKeypadValue,
    posSearch,
    cartSubtotal,
    
    // Setters
    setPosCart,
    setPosCustomerId,
    setPosDiscount,
    setPosTax,
    setPosDiscountPercent,
    setPosTaxPercent,
    setPosSelectedCategory,
    setPosOrderNumber,
    setPosKeypadValue,
    setPosSearch,
    
    // Actions
    addToCart,
    addCustomItemToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
  }
}

