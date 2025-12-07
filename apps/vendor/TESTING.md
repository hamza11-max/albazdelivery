# Vendor App Testing Guide

## Overview

The vendor app now has comprehensive test coverage for all extracted hooks and utility functions. This document provides guidance on running tests and understanding the test structure.

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- usePOSCart.test.tsx
```

### Run Tests Matching a Pattern
```bash
npm test -- --testNamePattern="should add product to cart"
```

## Test Structure

### Hooks Tests (`__tests__/hooks/`)

#### `usePOSCart.test.tsx`
Tests for the POS cart state management hook:
- Cart initialization
- Adding/removing products
- Quantity updates
- Subtotal calculations
- Cart clearing
- Multiple products handling

**Key Test Cases:**
- ✅ Initializes with empty cart
- ✅ Adds product to cart
- ✅ Increments quantity when adding same product
- ✅ Removes product from cart
- ✅ Updates cart quantity
- ✅ Removes item when quantity reaches zero
- ✅ Calculates cart subtotal correctly
- ✅ Clears cart and resets values
- ✅ Generates new order number on clear

#### `usePOSHandlers.test.tsx`
Tests for POS handler functions:
- Discount percentage calculations
- Tax percentage updates
- Keypad input handling
- Cart clearing

**Key Test Cases:**
- ✅ Calculates discount from percentage
- ✅ Clears discount when percentage is 0
- ✅ Handles empty cart scenarios
- ✅ Updates tax percentage
- ✅ Handles keypad backspace
- ✅ Appends keypad keys
- ✅ Clears discount
- ✅ Clears cart and resets tax

### Utility Tests (`__tests__/utils/`)

#### `electronUtils.test.ts`
Tests for Electron offline data loading:
- Loading products from localStorage
- Filtering low stock products
- Calculating sales statistics
- Computing top products from sales
- Error handling

**Key Test Cases:**
- ✅ Loads products from localStorage
- ✅ Filters low stock products correctly
- ✅ Calculates sales statistics correctly
- ✅ Computes top products from sales
- ✅ Handles empty localStorage gracefully
- ✅ Handles invalid JSON gracefully
- ✅ Filters out products without valid productId

#### `saleUtils.test.ts`
Tests for sale completion logic:
- Empty cart validation
- Total calculations (subtotal, discount, tax)
- Electron mode (localStorage)
- API mode (fetch)
- Stock updates
- Error handling

**Key Test Cases:**
- ✅ Shows error toast when cart is empty
- ✅ Calculates totals correctly
- ✅ Saves sale to localStorage in Electron mode
- ✅ Updates product stock after sale in Electron mode
- ✅ Calls API in non-Electron mode
- ✅ Handles API errors gracefully
- ✅ Clears cart after successful sale
- ✅ Shows success dialog after sale

#### `productUtils.test.ts`
Tests for product management:
- Saving new products
- Updating existing products
- Deleting products
- Electron vs API mode
- Form resetting

**Key Test Cases:**
- ✅ Saves new product to localStorage in Electron mode
- ✅ Updates existing product in Electron mode
- ✅ Calls API in non-Electron mode
- ✅ Handles API errors
- ✅ Resets form after successful save
- ✅ Deletes product from localStorage in Electron mode
- ✅ Does not delete if user cancels confirmation
- ✅ Calls API in non-Electron mode for deletion

#### `customerUtils.test.ts`
Tests for customer management:
- Saving customers
- Electron vs API mode
- Error handling

**Key Test Cases:**
- ✅ Saves customer to localStorage in Electron mode
- ✅ Calls API in non-Electron mode
- ✅ Handles API errors
- ✅ Shows success toast

#### `formUtils.test.ts`
Tests for form reset utilities:
- Product form reset
- Customer form reset

**Key Test Cases:**
- ✅ Returns empty product form
- ✅ Returns empty customer form

#### `driverUtils.test.ts`
Tests for driver management:
- Fetching drivers
- Accepting/rejecting driver requests
- Error handling

**Key Test Cases:**
- ✅ Fetches drivers successfully
- ✅ Does not fetch if activeVendorId is missing
- ✅ Handles fetch errors
- ✅ Handles empty response
- ✅ Accepts driver request
- ✅ Rejects driver request
- ✅ Handles API errors
- ✅ Handles network errors

#### `aiUtils.test.ts`
Tests for AI insights:
- Fetching sales forecasts
- Fetching inventory recommendations
- Fetching product bundles
- Error handling

**Key Test Cases:**
- ✅ Fetches AI insights successfully
- ✅ Fetches without vendorId when not provided
- ✅ Handles empty data
- ✅ Handles non-array recommendations and bundles
- ✅ Handles fetch errors gracefully
- ✅ Handles unsuccessful response

#### `orderUtils.test.ts`
Tests for order status updates:
- Status updates
- API calls
- Error handling

**Key Test Cases:**
- ✅ Updates order status successfully
- ✅ Handles API errors
- ✅ Handles network errors

## Mocking Strategy

### localStorage Mocking
All tests that interact with localStorage use a custom mock:
```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
```

### fetch API Mocking
Network requests are mocked using Jest's `global.fetch`:
```typescript
global.fetch = jest.fn()
;(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ success: true, data: {} }),
})
```

### React Hook Testing
Hooks are tested using `@testing-library/react`:
```typescript
import { renderHook, act } from '@testing-library/react'
const { result } = renderHook(() => usePOSCart())
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Mocking**: External dependencies (localStorage, fetch) are always mocked
3. **Error Cases**: All error paths are tested
4. **Edge Cases**: Boundary conditions are tested (empty arrays, null values, etc.)
5. **Cleanup**: Tests clean up after themselves (localStorage, mocks)

## Coverage Goals

- **Hooks**: 100% coverage of state management and business logic
- **Utilities**: 100% coverage of all functions, including error paths
- **Components**: Integration tests for major UI flows (future work)

## Continuous Integration

Tests are configured to run in CI/CD pipelines:
- All tests must pass before merging
- Coverage reports are generated
- Tests run in parallel for faster execution

## Troubleshooting

### Tests Not Running
- Ensure Jest is properly configured in `jest.config.ts`
- Check that test files match the pattern `*.test.ts` or `*.test.tsx`
- Verify test environment is set correctly (jsdom for UI tests)

### localStorage Issues
- Ensure localStorage mock is set up before tests run
- Clear localStorage between tests using `beforeEach`

### fetch Mocking Issues
- Reset mocks between tests: `jest.clearAllMocks()`
- Ensure mock responses match expected API format

## Future Test Additions

- Component integration tests
- End-to-end tests for critical user flows
- Performance tests for large datasets
- Accessibility tests

