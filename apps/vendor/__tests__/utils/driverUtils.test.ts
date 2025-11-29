import { fetchDrivers, respondToDriverRequest } from '../../utils/driverUtils'

// Mock fetch
global.fetch = jest.fn()

describe('driverUtils', () => {
  const mockSetters = {
    setConnectedDrivers: jest.fn(),
    setPendingDriverRequests: jest.fn(),
    setLoadingDrivers: jest.fn(),
  }

  const mockToast = jest.fn()
  const mockTranslate = jest.fn((fr: string) => fr)
  const mockPlaySuccessSound = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchDrivers', () => {
    it('should fetch drivers successfully', async () => {
      const mockData = {
        success: true,
        data: {
          connectedDrivers: [{ id: 1, name: 'Driver 1' }],
          pendingRequests: [{ id: 1, driverName: 'Driver 2' }],
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      await fetchDrivers({
        activeVendorId: 'vendor-1',
        ...mockSetters,
      })

      expect(mockSetters.setLoadingDrivers).toHaveBeenCalledWith(true)
      expect(mockSetters.setConnectedDrivers).toHaveBeenCalledWith([{ id: 1, name: 'Driver 1' }])
      expect(mockSetters.setPendingDriverRequests).toHaveBeenCalledWith([{ id: 1, driverName: 'Driver 2' }])
      expect(mockSetters.setLoadingDrivers).toHaveBeenCalledWith(false)
    })

    it('should not fetch if activeVendorId is missing', async () => {
      await fetchDrivers({
        activeVendorId: undefined,
        ...mockSetters,
      })

      expect(global.fetch).not.toHaveBeenCalled()
      expect(mockSetters.setLoadingDrivers).not.toHaveBeenCalled()
    })

    it('should handle fetch errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await fetchDrivers({
        activeVendorId: 'vendor-1',
        ...mockSetters,
      })

      expect(mockSetters.setLoadingDrivers).toHaveBeenCalledWith(false)
    })

    it('should handle empty response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      })

      await fetchDrivers({
        activeVendorId: 'vendor-1',
        ...mockSetters,
      })

      expect(mockSetters.setConnectedDrivers).toHaveBeenCalledWith([])
      expect(mockSetters.setPendingDriverRequests).toHaveBeenCalledWith([])
    })
  })

  describe('respondToDriverRequest', () => {
    const mockFetchDrivers = jest.fn()

    it('should accept driver request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await respondToDriverRequest({
        connectionId: 'conn-1',
        action: 'accept',
        fetchDrivers: mockFetchDrivers,
        toast: mockToast,
        translate: mockTranslate,
        playSuccessSound: mockPlaySuccessSound,
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vendors/drivers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ connectionId: 'conn-1', action: 'accept' }),
        })
      )
      expect(mockFetchDrivers).toHaveBeenCalled()
      expect(mockPlaySuccessSound).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('acceptée'),
        })
      )
    })

    it('should reject driver request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await respondToDriverRequest({
        connectionId: 'conn-1',
        action: 'reject',
        fetchDrivers: mockFetchDrivers,
        toast: mockToast,
        translate: mockTranslate,
        playSuccessSound: mockPlaySuccessSound,
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('refusée'),
        })
      )
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Error message' } }),
      })

      await respondToDriverRequest({
        connectionId: 'conn-1',
        action: 'accept',
        fetchDrivers: mockFetchDrivers,
        toast: mockToast,
        translate: mockTranslate,
        playSuccessSound: mockPlaySuccessSound,
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
        })
      )
      expect(mockFetchDrivers).not.toHaveBeenCalled()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await respondToDriverRequest({
        connectionId: 'conn-1',
        action: 'accept',
        fetchDrivers: mockFetchDrivers,
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
})


