import { useState, useMemo, useCallback } from "react"
import type { InventoryProduct } from "@/root/lib/types"
import type { CartItem } from "../app/vendor/types"

export function usePOSCart() {
  const [posCart, setPosCart] = useState<CartItem[]>([])
  const [posCustomerId, setPosCustomerId] = useState<number | null>(null)
  const [posDiscount, setPosDiscount] = useState(0)
  const [posTax, setPosTax] = useState(0)
  const [posDiscountPercent, setPosDiscountPercent] = useState(5)
  const [posTaxPercent, setPosTaxPercent] = useState(2)
  const [posSelectedCategory, setPosSelectedCategory] = useState<string>("all")
  const [posOrderNumber, setPosOrderNumber] = useState<string>(() => {
    return `ORD-${Date.now().toString().slice(-6)}`
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

  const removeFromCart = useCallback((id: number) => {
    setPosCart(posCart.filter((item) => item.id !== id))
  }, [posCart])

  const updateCartQuantity = useCallback((productId: number, delta: number) => {
    setPosCart(
      posCart
        .map((item) =>
          item.productId === productId 
            ? { ...item, quantity: Math.max(0, item.quantity + delta) } 
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }, [posCart])

  const clearCart = useCallback(() => {
    setPosCart([])
    setPosDiscount(0)
    setPosDiscountPercent(0)
    setPosKeypadValue("")
    setPosOrderNumber(`ORD-${Date.now().toString().slice(-6)}`)
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
    removeFromCart,
    updateCartQuantity,
    clearCart,
  }
}

