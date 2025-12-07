import { renderHook, act } from '@testing-library/react'
import { usePOSCart } from '../../hooks/usePOSCart'
import type { InventoryProduct } from '@/root/lib/types'

describe('usePOSCart', () => {
  const mockProduct: InventoryProduct = {
    id: 1,
    name: 'Test Product',
    sellingPrice: 10.99,
    costPrice: 5.00,
    stock: 100,
    category: 'Test',
    sku: 'TEST-001',
    description: 'Test description',
    lowStockThreshold: 10,
    barcode: '123456789',
    image: '',
    vendorId: 'vendor-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => usePOSCart())
    
    expect(result.current.posCart).toEqual([])
    expect(result.current.cartSubtotal).toBe(0)
    expect(result.current.posDiscount).toBe(0)
    expect(result.current.posTax).toBe(0)
  })

  it('should add product to cart', () => {
    const { result } = renderHook(() => usePOSCart())
    
    act(() => {
      result.current.addToCart(mockProduct)
    })
    
    expect(result.current.posCart).toHaveLength(1)
    expect(result.current.posCart[0]).toMatchObject({
      id: 1,
      productId: 1,
      productName: 'Test Product',
      quantity: 1,
      price: 10.99,
    })
    expect(result.current.cartSubtotal).toBe(10.99)
  })

  it('should increment quantity when adding same product again', () => {
    const { result } = renderHook(() => usePOSCart())
    
    act(() => {
      result.current.addToCart(mockProduct)
      result.current.addToCart(mockProduct)
    })
    
    expect(result.current.posCart).toHaveLength(1)
    expect(result.current.posCart[0].quantity).toBe(2)
    expect(result.current.cartSubtotal).toBe(21.98)
  })

  it('should remove product from cart', () => {
    const { result } = renderHook(() => usePOSCart())
    
    act(() => {
      result.current.addToCart(mockProduct)
      result.current.removeFromCart(1)
    })
    
    expect(result.current.posCart).toHaveLength(0)
    expect(result.current.cartSubtotal).toBe(0)
  })

  it('should update cart quantity', () => {
    const { result } = renderHook(() => usePOSCart())
    
    act(() => {
      result.current.addToCart(mockProduct)
    })
    
    expect(result.current.posCart[0].quantity).toBe(1)
    
    act(() => {
      result.current.updateCartQuantity(1, 2)
    })
    
    expect(result.current.posCart[0].quantity).toBe(3)
    expect(result.current.cartSubtotal).toBe(32.97)
  })

  it('should remove item when quantity reaches zero', () => {
    const { result } = renderHook(() => usePOSCart())
    
    act(() => {
      result.current.addToCart(mockProduct)
      result.current.updateCartQuantity(1, -1)
    })
    
    expect(result.current.posCart).toHaveLength(0)
  })

  it('should calculate cart subtotal correctly', () => {
    const { result } = renderHook(() => usePOSCart())
    
    const product2: InventoryProduct = {
      ...mockProduct,
      id: 2,
      name: 'Product 2',
      sellingPrice: 5.50,
    }
    
    act(() => {
      result.current.addToCart(mockProduct)
      result.current.addToCart(product2)
      result.current.addToCart(mockProduct) // Increment first product
    })
    
    expect(result.current.cartSubtotal).toBe(27.48) // 10.99 * 2 + 5.50
  })

  it('should clear cart and reset values', () => {
    const { result } = renderHook(() => usePOSCart())
    
    act(() => {
      result.current.addToCart(mockProduct)
      result.current.setPosDiscount(5)
      result.current.setPosDiscountPercent(10)
      result.current.setPosKeypadValue('5.00')
      result.current.clearCart()
    })
    
    expect(result.current.posCart).toHaveLength(0)
    expect(result.current.posDiscount).toBe(0)
    expect(result.current.posDiscountPercent).toBe(0)
    expect(result.current.posKeypadValue).toBe('')
    expect(result.current.posOrderNumber).toMatch(/^ORD-/)
  })

  it('should generate new order number on clear', () => {
    const { result } = renderHook(() => usePOSCart())
    
    const initialOrderNumber = result.current.posOrderNumber
    
    act(() => {
      result.current.clearCart()
    })
    
    expect(result.current.posOrderNumber).not.toBe(initialOrderNumber)
    expect(result.current.posOrderNumber).toMatch(/^ORD-/)
  })

  it('should handle multiple products correctly', () => {
    const { result } = renderHook(() => usePOSCart())
    
    const products: InventoryProduct[] = [
      mockProduct,
      { ...mockProduct, id: 2, name: 'Product 2', sellingPrice: 15.00 },
      { ...mockProduct, id: 3, name: 'Product 3', sellingPrice: 20.00 },
    ]
    
    act(() => {
      products.forEach(product => result.current.addToCart(product))
    })
    
    expect(result.current.posCart).toHaveLength(3)
    expect(result.current.cartSubtotal).toBe(45.99) // 10.99 + 15.00 + 20.00
  })
})


