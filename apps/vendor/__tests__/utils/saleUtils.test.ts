import { completeSale } from '../../utils/saleUtils'
import type { CartItem } from '../../app/vendor/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

describe('completeSale', () => {
  const mockCart: CartItem[] = [
    {
      id: 1,
      productId: 1,
      productName: 'Product 1',
      quantity: 2,
      price: 10.99,
      discount: 0,
    },
    {
      id: 2,
      productId: 2,
      productName: 'Product 2',
      quantity: 1,
      price: 5.50,
      discount: 0,
    },
  ]

  const mockSetters = {
    setSales: jest.fn(),
    setTodaySales: jest.fn(),
    setWeekSales: jest.fn(),
    setMonthSales: jest.fn(),
    setProducts: jest.fn(),
    setLowStockProducts: jest.fn(),
    setLastSale: jest.fn(),
    setCompletedSale: jest.fn(),
    setShowSaleSuccessDialog: jest.fn(),
    clearCart: jest.fn(),
    setPosTax: jest.fn(),
    setPosCustomerId: jest.fn(),
    setPosOrderNumber: jest.fn(),
  }

  const mockFetchers = {
    fetchDashboardData: jest.fn().mockResolvedValue({}),
    fetchInventory: jest.fn().mockResolvedValue({}),
    fetchSales: jest.fn().mockResolvedValue({}),
  }

  const mockToast = jest.fn()
  const mockTranslate = jest.fn((fr: string) => fr)

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('should show error toast when cart is empty', async () => {
    await completeSale({
      paymentMethod: 'cash',
      posCart: [],
      posDiscount: 0,
      posTaxPercent: 2,
      posCustomerId: null,
      isElectronRuntime: false,
      activeVendorId: 'vendor-1',
      isAdmin: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
      ...mockFetchers,
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Panier vide',
      description: 'Ajoutez des produits au panier avant de finaliser la vente',
      variant: 'destructive',
    })
    expect(mockSetters.setShowSaleSuccessDialog).not.toHaveBeenCalled()
  })

  it('should calculate totals correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'sale-1' } }),
    })

    await completeSale({
      paymentMethod: 'cash',
      posCart: mockCart,
      posDiscount: 2.00,
      posTaxPercent: 2,
      posCustomerId: null,
      isElectronRuntime: false,
      activeVendorId: 'vendor-1',
      isAdmin: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
      ...mockFetchers,
    })

    // Subtotal: 10.99 * 2 + 5.50 = 27.48
    // After discount: 27.48 - 2.00 = 25.48
    // Tax: 25.48 * 0.02 = 0.5096
    // Total: 25.48 + 0.5096 = 25.9896

    expect(global.fetch).toHaveBeenCalled()
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(fetchCall[1].body)
    
    expect(body.subtotal).toBe(27.48)
    expect(body.discount).toBe(2.00)
    // API expects total without tax: subtotal - discount = 27.48 - 2.00 = 25.48
    expect(body.total).toBe(25.48)
  })

  it('should save sale to localStorage in Electron mode', async () => {
    await completeSale({
      paymentMethod: 'card',
      posCart: mockCart,
      posDiscount: 0,
      posTaxPercent: 2,
      posCustomerId: null,
      isElectronRuntime: true,
      activeVendorId: 'vendor-1',
      isAdmin: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
      ...mockFetchers,
    })

    const storedSales = JSON.parse(localStorageMock.getItem('electron-sales') || '[]')
    expect(storedSales).toHaveLength(1)
    expect(storedSales[0].items).toHaveLength(2)
    expect(storedSales[0].paymentMethod).toBe('card')
    expect(storedSales[0].total).toBeGreaterThan(0)
  })

  it('should update product stock after sale in Electron mode', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', stock: 100 },
      { id: 2, name: 'Product 2', stock: 50 },
    ]
    localStorageMock.setItem('electron-inventory', JSON.stringify(mockProducts))

    await completeSale({
      paymentMethod: 'cash',
      posCart: mockCart,
      posDiscount: 0,
      posTaxPercent: 2,
      posCustomerId: null,
      isElectronRuntime: true,
      activeVendorId: 'vendor-1',
      isAdmin: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
      ...mockFetchers,
    })

    const updatedProducts = JSON.parse(localStorageMock.getItem('electron-inventory') || '[]')
    expect(updatedProducts[0].stock).toBe(98) // 100 - 2
    expect(updatedProducts[1].stock).toBe(49) // 50 - 1
  })

  it('should call API in non-Electron mode', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'sale-1' } }),
    })

    await completeSale({
      paymentMethod: 'cash',
      posCart: mockCart,
      posDiscount: 0,
      posTaxPercent: 2,
      posCustomerId: null,
      isElectronRuntime: false,
      activeVendorId: 'vendor-1',
      isAdmin: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
      ...mockFetchers,
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/erp/sales'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'API Error' }),
    })

    await completeSale({
      paymentMethod: 'cash',
      posCart: mockCart,
      posDiscount: 0,
      posTaxPercent: 2,
      posCustomerId: null,
      isElectronRuntime: false,
      activeVendorId: 'vendor-1',
      isAdmin: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
      ...mockFetchers,
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
      })
    )
  })

  it('should clear cart after successful sale', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'sale-1' } }),
    })

    await completeSale({
      paymentMethod: 'cash',
      posCart: mockCart,
      posDiscount: 0,
      posTaxPercent: 2,
      posCustomerId: null,
      isElectronRuntime: false,
      activeVendorId: 'vendor-1',
      isAdmin: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
      ...mockFetchers,
    })

    expect(mockSetters.clearCart).toHaveBeenCalled()
    expect(mockSetters.setPosTax).toHaveBeenCalledWith(0)
    expect(mockSetters.setPosCustomerId).toHaveBeenCalledWith(null)
  })

  it('should show success dialog after sale', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 'sale-1' } }),
    })

    await completeSale({
      paymentMethod: 'cash',
      posCart: mockCart,
      posDiscount: 0,
      posTaxPercent: 2,
      posCustomerId: null,
      isElectronRuntime: false,
      activeVendorId: 'vendor-1',
      isAdmin: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
      ...mockFetchers,
    })

    expect(mockSetters.setShowSaleSuccessDialog).toHaveBeenCalledWith(true)
    expect(mockSetters.setLastSale).toHaveBeenCalled()
    expect(mockSetters.setCompletedSale).toHaveBeenCalled()
  })
})

