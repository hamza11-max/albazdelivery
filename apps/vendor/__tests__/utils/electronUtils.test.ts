import { loadElectronOfflineData } from '../../utils/electronUtils'
import type { TopProductData } from '../../app/vendor/types'

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

describe('loadElectronOfflineData', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('should load products from localStorage', () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', stock: 50, lowStockThreshold: 10 },
      { id: 2, name: 'Product 2', stock: 5, lowStockThreshold: 10 },
    ]
    
    localStorageMock.setItem('electron-inventory', JSON.stringify(mockProducts))
    
    const setProducts = jest.fn()
    const setLowStockProducts = jest.fn()
    
    loadElectronOfflineData({
      setProducts,
      setLowStockProducts,
      setSales: jest.fn(),
      setSuppliers: jest.fn(),
      setCustomers: jest.fn(),
      setTodaySales: jest.fn(),
      setWeekSales: jest.fn(),
      setMonthSales: jest.fn(),
      setTopProducts: jest.fn(),
    })
    
    expect(setProducts).toHaveBeenCalledWith(mockProducts)
    expect(setLowStockProducts).toHaveBeenCalledWith([mockProducts[1]])
  })

  it('should filter low stock products correctly', () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', stock: 50, lowStockThreshold: 10 },
      { id: 2, name: 'Product 2', stock: 5, lowStockThreshold: 10 },
      { id: 3, name: 'Product 3', stock: 8, lowStockThreshold: 10 },
    ]
    
    localStorageMock.setItem('electron-inventory', JSON.stringify(mockProducts))
    
    const setLowStockProducts = jest.fn()
    
    loadElectronOfflineData({
      setProducts: jest.fn(),
      setLowStockProducts,
      setSales: jest.fn(),
      setSuppliers: jest.fn(),
      setCustomers: jest.fn(),
      setTodaySales: jest.fn(),
      setWeekSales: jest.fn(),
      setMonthSales: jest.fn(),
      setTopProducts: jest.fn(),
    })
    
    expect(setLowStockProducts).toHaveBeenCalledWith([
      mockProducts[1],
      mockProducts[2],
    ])
  })

  it('should calculate sales statistics correctly', () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000)
    
    const mockSales = [
      { id: 1, total: 100, createdAt: today.toISOString() },
      { id: 2, total: 50, createdAt: yesterday.toISOString() },
      { id: 3, total: 75, createdAt: lastWeek.toISOString() },
    ]
    
    localStorageMock.setItem('electron-sales', JSON.stringify(mockSales))
    
    const setTodaySales = jest.fn()
    const setWeekSales = jest.fn()
    const setMonthSales = jest.fn()
    
    loadElectronOfflineData({
      setProducts: jest.fn(),
      setLowStockProducts: jest.fn(),
      setSales: jest.fn(),
      setSuppliers: jest.fn(),
      setCustomers: jest.fn(),
      setTodaySales,
      setWeekSales,
      setMonthSales,
      setTopProducts: jest.fn(),
    })
    
    expect(setTodaySales).toHaveBeenCalledWith(100)
    expect(setWeekSales).toHaveBeenCalledWith(150) // today + yesterday
    expect(setMonthSales).toHaveBeenCalledWith(225) // all sales
  })

  it('should compute top products from sales', () => {
    const mockSales = [
      {
        id: 1,
        items: [
          { productId: 1, productName: 'Product A', quantity: 5, price: 10 },
          { productId: 2, productName: 'Product B', quantity: 3, price: 15 },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        items: [
          { productId: 1, productName: 'Product A', quantity: 2, price: 10 },
          { productId: 3, productName: 'Product C', quantity: 1, price: 20 },
        ],
        createdAt: new Date().toISOString(),
      },
    ]
    
    localStorageMock.setItem('electron-sales', JSON.stringify(mockSales))
    
    const setTopProducts = jest.fn()
    
    loadElectronOfflineData({
      setProducts: jest.fn(),
      setLowStockProducts: jest.fn(),
      setSales: jest.fn(),
      setSuppliers: jest.fn(),
      setCustomers: jest.fn(),
      setTodaySales: jest.fn(),
      setWeekSales: jest.fn(),
      setMonthSales: jest.fn(),
      setTopProducts,
    })
    
    expect(setTopProducts).toHaveBeenCalled()
    const topProducts = setTopProducts.mock.calls[0][0] as TopProductData[]
    
    expect(topProducts).toHaveLength(3)
    expect(topProducts[0].productId).toBe(1) // Product A has highest sales (70)
    expect(topProducts[0].totalSales).toBe(70) // 5*10 + 2*10
    expect(topProducts[0].totalQuantity).toBe(7)
  })

  it('should handle empty localStorage gracefully', () => {
    const setProducts = jest.fn()
    const setSales = jest.fn()
    
    loadElectronOfflineData({
      setProducts,
      setLowStockProducts: jest.fn(),
      setSales,
      setSuppliers: jest.fn(),
      setCustomers: jest.fn(),
      setTodaySales: jest.fn(),
      setWeekSales: jest.fn(),
      setMonthSales: jest.fn(),
      setTopProducts: jest.fn(),
    })
    
    expect(setProducts).not.toHaveBeenCalled()
    expect(setSales).not.toHaveBeenCalled()
  })

  it('should handle invalid JSON gracefully', () => {
    localStorageMock.setItem('electron-inventory', 'invalid json')
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    expect(() => {
      loadElectronOfflineData({
        setProducts: jest.fn(),
        setLowStockProducts: jest.fn(),
        setSales: jest.fn(),
        setSuppliers: jest.fn(),
        setCustomers: jest.fn(),
        setTodaySales: jest.fn(),
        setWeekSales: jest.fn(),
        setMonthSales: jest.fn(),
        setTopProducts: jest.fn(),
      })
    }).not.toThrow()
    
    // handleError logs to console.error, not console.warn
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should filter out products without valid productId in top products', () => {
    const mockSales = [
      {
        id: 1,
        items: [
          { productName: 'Product Without ID', quantity: 5, price: 10 }, // No productId
          { productId: 1, productName: 'Product With ID', quantity: 3, price: 15 },
        ],
        createdAt: new Date().toISOString(),
      },
    ]
    
    localStorageMock.setItem('electron-sales', JSON.stringify(mockSales))
    
    const setTopProducts = jest.fn()
    
    loadElectronOfflineData({
      setProducts: jest.fn(),
      setLowStockProducts: jest.fn(),
      setSales: jest.fn(),
      setSuppliers: jest.fn(),
      setCustomers: jest.fn(),
      setTodaySales: jest.fn(),
      setWeekSales: jest.fn(),
      setMonthSales: jest.fn(),
      setTopProducts,
    })
    
    const topProducts = setTopProducts.mock.calls[0][0] as TopProductData[]
    expect(topProducts.every(p => p.productId > 0)).toBe(true)
  })
})


