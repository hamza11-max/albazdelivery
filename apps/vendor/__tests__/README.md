# Vendor App Tests

This directory contains comprehensive test suites for the refactored vendor app components, hooks, and utilities.

## Test Structure

### Hooks (`hooks/`)
- **`usePOSCart.test.tsx`** - Tests for POS cart state management
  - Cart initialization
  - Adding/removing products
  - Quantity updates
  - Subtotal calculations
  - Cart clearing

- **`usePOSHandlers.test.tsx`** - Tests for POS handler functions
  - Discount percentage calculations
  - Tax percentage updates
  - Keypad input handling
  - Cart clearing

### Utilities (`utils/`)
- **`electronUtils.test.ts`** - Tests for Electron offline data loading
  - Loading products from localStorage
  - Filtering low stock products
  - Calculating sales statistics
  - Computing top products from sales
  - Error handling

- **`saleUtils.test.ts`** - Tests for sale completion logic
  - Empty cart validation
  - Total calculations (subtotal, discount, tax)
  - Electron mode (localStorage)
  - API mode (fetch)
  - Stock updates
  - Error handling

- **`productUtils.test.ts`** - Tests for product management
  - Saving new products
  - Updating existing products
  - Deleting products
  - Electron vs API mode
  - Form resetting

- **`customerUtils.test.ts`** - Tests for customer management
  - Saving customers
  - Electron vs API mode
  - Error handling

- **`formUtils.test.ts`** - Tests for form reset utilities
  - Product form reset
  - Customer form reset

- **`driverUtils.test.ts`** - Tests for driver management
  - Fetching drivers
  - Accepting/rejecting driver requests
  - Error handling

- **`aiUtils.test.ts`** - Tests for AI insights
  - Fetching sales forecasts
  - Fetching inventory recommendations
  - Fetching product bundles
  - Error handling

- **`orderUtils.test.ts`** - Tests for order status updates
  - Status updates
  - API calls
  - Error handling

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- usePOSCart.test.tsx
```

## Test Coverage Goals

- **Hooks**: 100% coverage of state management and business logic
- **Utilities**: 100% coverage of all functions, including error paths
- **Components**: Integration tests for major UI flows

## Mocking

Tests use:
- `jest.fn()` for function mocks
- `localStorageMock` for localStorage operations
- `global.fetch` mocking for API calls
- `@testing-library/react` for React hook testing

## Notes

- All tests are isolated and don't depend on external services
- Electron-specific tests mock localStorage
- API tests mock fetch responses
- Error cases are thoroughly tested


