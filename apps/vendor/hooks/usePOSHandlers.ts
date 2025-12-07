"use client"

import { useCallback } from "react"

interface UsePOSHandlersParams {
  cartSubtotal: number
  setPosDiscountPercent: (value: number) => void
  setPosDiscount: (value: number) => void
  setPosKeypadValue: (value: string) => void
  setPosTaxPercent: (value: number) => void
  setPosTax: (value: number) => void
  clearCart: () => void
  setPosTaxPercentDefault: (value: number) => void
}

export function usePOSHandlers({
  cartSubtotal,
  setPosDiscountPercent,
  setPosDiscount,
  setPosKeypadValue,
  setPosTaxPercent,
  setPosTax,
  clearCart,
  setPosTaxPercentDefault,
}: UsePOSHandlersParams) {
  const handleDiscountPercentChange = useCallback((value: number) => {
    setPosDiscountPercent(value)
    if (value > 0 && cartSubtotal > 0) {
      const calculatedDiscount = cartSubtotal * (value / 100)
      setPosDiscount(calculatedDiscount)
      setPosKeypadValue(calculatedDiscount.toFixed(2))
    } else {
      setPosDiscount(0)
      setPosKeypadValue("")
    }
  }, [cartSubtotal, setPosDiscountPercent, setPosDiscount, setPosKeypadValue])

  const handleTaxPercentChange = useCallback((value: number) => {
    setPosTaxPercent(value)
  }, [setPosTaxPercent])

  const handleKeypadKey = useCallback((key: string) => {
    if (key === "⌫") {
      setPosKeypadValue((prev) => prev.slice(0, -1))
    } else {
      setPosKeypadValue((prev) => prev + key)
    }
  }, [setPosKeypadValue])

  const handleClearDiscount = useCallback(() => {
    setPosKeypadValue("")
    setPosDiscount(0)
    setPosDiscountPercent(0)
  }, [setPosKeypadValue, setPosDiscount, setPosDiscountPercent])

  const handleClearCart = useCallback(() => {
    clearCart()
    setPosTax(0)
    setPosTaxPercentDefault(2)
  }, [clearCart, setPosTax, setPosTaxPercentDefault])

  return {
    handleDiscountPercentChange,
    handleTaxPercentChange,
    handleKeypadKey,
    handleClearDiscount,
    handleClearCart,
  }
}

