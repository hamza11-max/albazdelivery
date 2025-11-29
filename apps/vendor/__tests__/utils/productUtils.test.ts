import { saveProduct, deleteProduct } from '../../utils/productUtils'
import type { InventoryProduct, ProductForm } from '../../app/vendor/types'

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

describe('productUtils', () => {
  const mockProductForm: ProductForm = {
    sku: 'TEST-001',
    name: 'Test Product',
    category: 'Test Category',
    description: 'Test Description',
    supplierId: 'supplier-1',
    costPrice: '5.00',
    sellingPrice: '10.99',
    price: '10.99',
    stock: 100,
    lowStockThreshold: 10,
    barcode: '123456789',
    image: 'test-image.jpg',
  }

  const mockSetters = {
    setProducts: jest.fn(),
    setLowStockProducts: jest.fn(),
    setProductForm: jest.fn(),
    setEditingProduct: jest.fn(),
    setShowProductDialog: jest.fn(),
  }

  const mockToast = jest.fn()
  const mockTranslate = jest.fn((fr: string) => fr)

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('saveProduct', () => {
    it('should save new product to localStorage in Electron mode', async () => {
      await saveProduct({
        productForm: mockProductForm,
        editingProduct: null,
        activeVendorId: 'vendor-1',
        isElectronRuntime: true,
        toast: mockToast,
        translate: mockTranslate,
        ...mockSetters,
      })

      const storedProducts = JSON.parse(localStorageMock.getItem('electron-inventory') || '[]')
      expect(storedProducts).toHaveLength(1)
      expect(storedProducts[0].name).toBe('Test Product')
      expect(storedProducts[0].sellingPrice).toBe(10.99)
      expect(mockSetters.setProducts).toHaveBeenCalled()
      expect(mockSetters.setShowProductDialog).toHaveBeenCalledWith(false)
    })

    it('should update existing product in Electron mode', async () => {
      const existingProduct: InventoryProduct = {
        id: 1,
        name: 'Old Product',
        sellingPrice: 5.00,
        costPrice: 2.00,
        stock: 50,
        category: 'Old Category',
        sku: 'OLD-001',
        description: 'Old Description',
        lowStockThreshold: 10,
        barcode: '111111111',
        image: '',
        vendorId: 'vendor-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      localStorageMock.setItem('electron-inventory', JSON.stringify([existingProduct]))

      await saveProduct({
        productForm: { ...mockProductForm, name: 'Updated Product' },
        editingProduct: existingProduct,
        activeVendorId: 'vendor-1',
        isElectronRuntime: true,
        toast: mockToast,
        translate: mockTranslate,
        ...mockSetters,
      })

      const storedProducts = JSON.parse(localStorageMock.getItem('electron-inventory') || '[]')
      expect(storedProducts).toHaveLength(1)
      expect(storedProducts[0].name).toBe('Updated Product')
      expect(storedProducts[0].id).toBe(1)
    })

    it('should call API in non-Electron mode', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 1 } }),
      })

      await saveProduct({
        productForm: mockProductForm,
        editingProduct: null,
        activeVendorId: 'vendor-1',
        isElectronRuntime: false,
        toast: mockToast,
        translate: mockTranslate,
        fetchInventory: jest.fn().mockResolvedValue({}),
        fetchDashboardData: jest.fn().mockResolvedValue({}),
        fetchProducts: jest.fn().mockResolvedValue({}),
        ...mockSetters,
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/erp/inventory'),
        expect.objectContaining({
          method: 'POST', // New products use POST
        })
      )
    })

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'API Error' }),
      })

      await saveProduct({
        productForm: mockProductForm,
        editingProduct: null,
        activeVendorId: 'vendor-1',
        isElectronRuntime: false,
        toast: mockToast,
        translate: mockTranslate,
        fetchInventory: jest.fn(),
        fetchDashboardData: jest.fn(),
        fetchProducts: jest.fn(),
        ...mockSetters,
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
        })
      )
    })

    it('should reset form after successful save', async () => {
      await saveProduct({
        productForm: mockProductForm,
        editingProduct: null,
        activeVendorId: 'vendor-1',
        isElectronRuntime: true,
        toast: mockToast,
        translate: mockTranslate,
        ...mockSetters,
      })

      expect(mockSetters.setProductForm).toHaveBeenCalledWith({
        sku: '',
        name: '',
        category: '',
        description: '',
        supplierId: '',
        costPrice: '',
        sellingPrice: '',
        price: '',
        stock: 0,
        lowStockThreshold: 0,
        barcode: '',
        image: '',
      })
      expect(mockSetters.setEditingProduct).toHaveBeenCalledWith(null)
    })
  })

  describe('deleteProduct', () => {
    it('should delete product from localStorage in Electron mode', async () => {
      const mockProducts: InventoryProduct[] = [
        {
          id: 1,
          name: 'Product 1',
          sellingPrice: 10,
          costPrice: 5,
          stock: 100,
          category: 'Test',
          sku: 'TEST-001',
          description: '',
          lowStockThreshold: 10,
          barcode: '',
          image: '',
          vendorId: 'vendor-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Product 2',
          sellingPrice: 15,
          costPrice: 8,
          stock: 50,
          category: 'Test',
          sku: 'TEST-002',
          description: '',
          lowStockThreshold: 10,
          barcode: '',
          image: '',
          vendorId: 'vendor-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      localStorageMock.setItem('electron-inventory', JSON.stringify(mockProducts))

      await deleteProduct({
        id: 1,
        activeVendorId: 'vendor-1',
        isElectronRuntime: true,
        setProducts: mockSetters.setProducts,
        setLowStockProducts: mockSetters.setLowStockProducts,
        fetchInventory: jest.fn(),
        fetchDashboardData: jest.fn(),
        toast: mockToast,
        translate: mockTranslate,
      })

      const storedProducts = JSON.parse(localStorageMock.getItem('electron-inventory') || '[]')
      expect(storedProducts).toHaveLength(1)
      expect(storedProducts[0].id).toBe(2)
    })

    it('should delete product from localStorage in Electron mode', async () => {
      // Add products first
      const mockProducts = [
        { id: 1, name: 'Product 1', stock: 100 },
        { id: 2, name: 'Product 2', stock: 50 },
      ]
      localStorageMock.setItem('electron-inventory', JSON.stringify(mockProducts))

      await deleteProduct({
        id: 1,
        activeVendorId: 'vendor-1',
        isElectronRuntime: true,
        setProducts: mockSetters.setProducts,
        setLowStockProducts: mockSetters.setLowStockProducts,
        fetchInventory: jest.fn(),
        fetchDashboardData: jest.fn(),
        toast: mockToast,
        translate: mockTranslate,
      })

      // Note: Confirmation is handled by the caller, not this utility function
      // This test verifies the deletion logic works correctly
      const storedProducts = JSON.parse(localStorageMock.getItem('electron-inventory') || '[]')
      expect(storedProducts.length).toBe(1)
      expect(storedProducts[0].id).toBe(2)
      expect(mockSetters.setProducts).toHaveBeenCalled()
    })

    it('should call API in non-Electron mode', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      window.confirm = jest.fn(() => true)

      await deleteProduct({
        id: 1,
        activeVendorId: 'vendor-1',
        isElectronRuntime: false,
        setProducts: mockSetters.setProducts,
        setLowStockProducts: mockSetters.setLowStockProducts,
        fetchInventory: jest.fn().mockResolvedValue({}),
        fetchDashboardData: jest.fn().mockResolvedValue({}),
        toast: mockToast,
        translate: mockTranslate,
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/erp/inventory'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })
})


