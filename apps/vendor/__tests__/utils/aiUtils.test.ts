import { fetchAIInsights } from '../../utils/aiUtils'

// Mock fetch
global.fetch = jest.fn()

describe('fetchAIInsights', () => {
  const mockSetters = {
    setSalesForecast: jest.fn(),
    setInventoryRecommendations: jest.fn(),
    setProductBundles: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch AI insights successfully', async () => {
    const mockData = {
      success: true,
      data: {
        forecast: { revenue: 1000, growth: 10 },
        recommendations: [{ productId: 1, action: 'restock' }],
        bundles: [{ products: [1, 2], discount: 10 }],
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    await fetchAIInsights({
      activeVendorId: 'vendor-1',
      ...mockSetters,
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/erp/ai-insights?vendorId=vendor-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
    expect(mockSetters.setSalesForecast).toHaveBeenCalledWith({ revenue: 1000, growth: 10 })
    expect(mockSetters.setInventoryRecommendations).toHaveBeenCalledWith([{ productId: 1, action: 'restock' }])
    expect(mockSetters.setProductBundles).toHaveBeenCalledWith([{ products: [1, 2], discount: 10 }])
  })

  it('should fetch without vendorId when not provided', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    })

    await fetchAIInsights({
      activeVendorId: undefined,
      ...mockSetters,
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/erp/ai-insights',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('should handle empty data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    })

    await fetchAIInsights({
      activeVendorId: 'vendor-1',
      ...mockSetters,
    })

    expect(mockSetters.setSalesForecast).toHaveBeenCalledWith(null)
    expect(mockSetters.setInventoryRecommendations).toHaveBeenCalledWith([])
    expect(mockSetters.setProductBundles).toHaveBeenCalledWith([])
  })

  it('should handle non-array recommendations and bundles', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          recommendations: 'not an array',
          bundles: null,
        },
      }),
    })

    await fetchAIInsights({
      activeVendorId: 'vendor-1',
      ...mockSetters,
    })

    expect(mockSetters.setInventoryRecommendations).toHaveBeenCalledWith([])
    expect(mockSetters.setProductBundles).toHaveBeenCalledWith([])
  })

  it('should handle fetch errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    await fetchAIInsights({
      activeVendorId: 'vendor-1',
      ...mockSetters,
    })

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should handle unsuccessful response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    })

    await fetchAIInsights({
      activeVendorId: 'vendor-1',
      ...mockSetters,
    })

    // Should set empty values if success is false
    expect(mockSetters.setSalesForecast).toHaveBeenCalledWith(null)
    expect(mockSetters.setInventoryRecommendations).toHaveBeenCalledWith([])
    expect(mockSetters.setProductBundles).toHaveBeenCalledWith([])
  })
})


