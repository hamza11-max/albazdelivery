import { updateOrderStatus } from '../../utils/orderUtils'

// Mock fetch
global.fetch = jest.fn()

describe('updateOrderStatus', () => {
  const mockFetchOrders = jest.fn().mockResolvedValue({})
  const mockToast = jest.fn()
  const mockTranslate = jest.fn((fr: string) => fr)
  const mockPlaySuccessSound = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update order status successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    await updateOrderStatus({
      orderId: 'order-1',
      status: 'DELIVERED',
      fetchOrders: mockFetchOrders,
      activeVendorId: 'vendor-1',
      toast: mockToast,
      translate: mockTranslate,
      playSuccessSound: mockPlaySuccessSound,
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/orders/order-1/status',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ status: 'DELIVERED' }),
      })
    )
    expect(mockFetchOrders).toHaveBeenCalled()
    expect(mockPlaySuccessSound).toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'default',
      })
    )
  })

  it('should handle API errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: 'Error message' } }),
    })

    await updateOrderStatus({
      orderId: 'order-1',
      status: 'DELIVERED',
      fetchOrders: mockFetchOrders,
      activeVendorId: 'vendor-1',
      toast: mockToast,
      translate: mockTranslate,
      playSuccessSound: mockPlaySuccessSound,
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
      })
    )
    expect(mockFetchOrders).not.toHaveBeenCalled()
  })

  it('should handle network errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    await updateOrderStatus({
      orderId: 'order-1',
      status: 'DELIVERED',
      fetchOrders: mockFetchOrders,
      activeVendorId: 'vendor-1',
      toast: mockToast,
      translate: mockTranslate,
      playSuccessSound: mockPlaySuccessSound,
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
      })
    )
  })
})

