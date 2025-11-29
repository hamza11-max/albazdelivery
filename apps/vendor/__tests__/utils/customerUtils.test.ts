import { saveCustomer } from '../../utils/customerUtils'
import type { CustomerForm } from '../../app/vendor/types'

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

describe('saveCustomer', () => {
  const mockCustomerForm: CustomerForm = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main St',
  }

  const mockSetters = {
    setCustomers: jest.fn(),
    setShowCustomerDialog: jest.fn(),
    resetCustomerForm: jest.fn(),
  }

  const mockToast = jest.fn()
  const mockTranslate = jest.fn((fr: string) => fr)

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('should save customer to localStorage in Electron mode', async () => {
    await saveCustomer({
      customerForm: mockCustomerForm,
      activeVendorId: 'vendor-1',
      isElectronRuntime: true,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
    })

    const storedCustomers = JSON.parse(localStorageMock.getItem('electron-customers') || '[]')
    expect(storedCustomers).toHaveLength(1)
    expect(storedCustomers[0].name).toBe('John Doe')
    expect(storedCustomers[0].email).toBe('john@example.com')
    expect(mockSetters.setCustomers).toHaveBeenCalled()
    expect(mockSetters.setShowCustomerDialog).toHaveBeenCalledWith(false)
    expect(mockSetters.resetCustomerForm).toHaveBeenCalled()
  })

  it('should call API in non-Electron mode', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 1 } }),
    })

    await saveCustomer({
      customerForm: mockCustomerForm,
      activeVendorId: 'vendor-1',
      isElectronRuntime: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/erp/customers'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'API Error' }),
    })

    await saveCustomer({
      customerForm: mockCustomerForm,
      activeVendorId: 'vendor-1',
      isElectronRuntime: false,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
      })
    )
  })

  it('should show success toast', async () => {
    await saveCustomer({
      customerForm: mockCustomerForm,
      activeVendorId: 'vendor-1',
      isElectronRuntime: true,
      toast: mockToast,
      translate: mockTranslate,
      ...mockSetters,
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'default',
      })
    )
  })
})

