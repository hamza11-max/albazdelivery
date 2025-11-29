import { renderHook, act } from '@testing-library/react'
import { usePOSHandlers } from '../../hooks/usePOSHandlers'

describe('usePOSHandlers', () => {
  const mockSetters = {
    setPosDiscountPercent: jest.fn(),
    setPosDiscount: jest.fn(),
    setPosKeypadValue: jest.fn(),
    setPosTaxPercent: jest.fn(),
    setPosTax: jest.fn(),
    clearCart: jest.fn(),
    setPosTaxPercentDefault: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should calculate discount from percentage', () => {
    const { result } = renderHook(() =>
      usePOSHandlers({
        cartSubtotal: 100,
        ...mockSetters,
      })
    )

    act(() => {
      result.current.handleDiscountPercentChange(10)
    })

    expect(mockSetters.setPosDiscountPercent).toHaveBeenCalledWith(10)
    expect(mockSetters.setPosDiscount).toHaveBeenCalledWith(10) // 100 * 0.10
    expect(mockSetters.setPosKeypadValue).toHaveBeenCalledWith('10.00')
  })

  it('should clear discount when percentage is 0', () => {
    const { result } = renderHook(() =>
      usePOSHandlers({
        cartSubtotal: 100,
        ...mockSetters,
      })
    )

    act(() => {
      result.current.handleDiscountPercentChange(0)
    })

    expect(mockSetters.setPosDiscount).toHaveBeenCalledWith(0)
    expect(mockSetters.setPosKeypadValue).toHaveBeenCalledWith('')
  })

  it('should not calculate discount when cart is empty', () => {
    const { result } = renderHook(() =>
      usePOSHandlers({
        cartSubtotal: 0,
        ...mockSetters,
      })
    )

    act(() => {
      result.current.handleDiscountPercentChange(10)
    })

    expect(mockSetters.setPosDiscount).toHaveBeenCalledWith(0)
    expect(mockSetters.setPosKeypadValue).toHaveBeenCalledWith('')
  })

  it('should update tax percentage', () => {
    const { result } = renderHook(() =>
      usePOSHandlers({
        cartSubtotal: 100,
        ...mockSetters,
      })
    )

    act(() => {
      result.current.handleTaxPercentChange(5)
    })

    expect(mockSetters.setPosTaxPercent).toHaveBeenCalledWith(5)
  })

  it('should handle keypad backspace', () => {
    const { result } = renderHook(() =>
      usePOSHandlers({
        cartSubtotal: 100,
        ...mockSetters,
      })
    )

    // Set initial value
    mockSetters.setPosKeypadValue.mockImplementation((value: string | ((prev: string) => string)) => {
      if (typeof value === 'function') {
        return value('123')
      }
    })

    act(() => {
      result.current.handleKeypadKey('⌫')
    })

    expect(mockSetters.setPosKeypadValue).toHaveBeenCalled()
  })

  it('should append keypad keys', () => {
    const { result } = renderHook(() =>
      usePOSHandlers({
        cartSubtotal: 100,
        ...mockSetters,
      })
    )

    mockSetters.setPosKeypadValue.mockImplementation((value: string | ((prev: string) => string)) => {
      if (typeof value === 'function') {
        return value('12')
      }
    })

    act(() => {
      result.current.handleKeypadKey('3')
    })

    expect(mockSetters.setPosKeypadValue).toHaveBeenCalled()
  })

  it('should clear discount', () => {
    const { result } = renderHook(() =>
      usePOSHandlers({
        cartSubtotal: 100,
        ...mockSetters,
      })
    )

    act(() => {
      result.current.handleClearDiscount()
    })

    expect(mockSetters.setPosKeypadValue).toHaveBeenCalledWith('')
    expect(mockSetters.setPosDiscount).toHaveBeenCalledWith(0)
    expect(mockSetters.setPosDiscountPercent).toHaveBeenCalledWith(0)
  })

  it('should clear cart and reset tax', () => {
    const { result } = renderHook(() =>
      usePOSHandlers({
        cartSubtotal: 100,
        ...mockSetters,
      })
    )

    act(() => {
      result.current.handleClearCart()
    })

    expect(mockSetters.clearCart).toHaveBeenCalled()
    expect(mockSetters.setPosTax).toHaveBeenCalledWith(0)
    expect(mockSetters.setPosTaxPercentDefault).toHaveBeenCalledWith(2)
  })
})


