# Error Handling Documentation

## Overview

The vendor app now has comprehensive, centralized error handling that provides consistent error management across all utilities and components.

## Architecture

### Centralized Error Handling (`utils/errorHandling.ts`)

All error handling is centralized in a single utility file that provides:

1. **Custom Error Classes**
   - `VendorAppError` - Base error class
   - `NetworkError` - Network/connection errors
   - `ValidationError` - Input validation errors
   - `APIError` - API response errors
   - `StorageError` - localStorage errors

2. **Error Handler Function**
   - `handleError()` - Centralized error processing
   - Automatically logs errors
   - Shows user-friendly toast messages
   - Supports translation

3. **Safe Utilities**
   - `safeJsonParse()` - Safe JSON parsing with fallback
   - `safeLocalStorageGet()` - Safe localStorage reads
   - `safeLocalStorageSet()` - Safe localStorage writes
   - `safeFetch()` - Safe fetch wrapper with error handling
   - `parseAPIResponse()` - Validates and parses API responses

4. **Retry Logic**
   - `retryWithBackoff()` - Exponential backoff retry mechanism

## Usage

### In Utility Functions

```typescript
import { handleError, safeFetch, parseAPIResponse, APIError } from "./errorHandling"

try {
  const response = await safeFetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  const result = await parseAPIResponse(response)
  // Handle success
} catch (error) {
  handleError(error, {
    showToast: true,
    logError: true,
    translate,
    toast,
    fallbackMessage: {
      fr: "Une erreur est survenue",
      ar: "حدث خطأ"
    }
  })
}
```

### Error Types

#### NetworkError
```typescript
throw new NetworkError('Connection failed', originalError)
```

#### ValidationError
```typescript
throw new ValidationError('Invalid input', 'fieldName')
```

#### APIError
```typescript
throw new APIError('API request failed', statusCode, responseData)
```

#### StorageError
```typescript
throw new StorageError('Failed to save', originalError)
```

## Error Messages

Error messages are automatically translated and shown to users:

- **Network errors**: Connection issues
- **Validation errors**: Input validation failures
- **API errors**: Server errors with status codes
- **Storage errors**: localStorage access issues

## Error Boundary

React Error Boundary component (`components/ErrorBoundary.tsx`) catches React component errors:

```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

Features:
- Catches React component errors
- Shows user-friendly error UI
- Provides retry and reload options
- Shows error details in development mode

## Implementation Status

### ✅ Updated Utilities

All utility functions now use centralized error handling:

- ✅ `saleUtils.ts` - Sale completion with error handling
- ✅ `productUtils.ts` - Product CRUD operations
- ✅ `customerUtils.ts` - Customer management
- ✅ `supplierUtils.ts` - Supplier management
- ✅ `orderUtils.ts` - Order status updates
- ✅ `fileUtils.ts` - File upload with validation
- ✅ `driverUtils.ts` - Driver management
- ✅ `aiUtils.ts` - AI insights fetching
- ✅ `dataUtils.ts` - Data loading
- ✅ `electronUtils.ts` - Electron offline data

### Error Handling Features

1. **Consistent Error Messages**
   - All errors use the same format
   - Translated messages (French/Arabic)
   - User-friendly descriptions

2. **Error Logging**
   - All errors are logged to console
   - Includes error context and stack traces
   - Can be extended to error reporting services

3. **Graceful Degradation**
   - Functions return safe defaults on error
   - UI continues to work even if some features fail
   - Background operations don't interrupt user flow

4. **Input Validation**
   - File size validation (5MB max)
   - File type validation (images only)
   - Required field validation
   - Data type validation

5. **Network Resilience**
   - Automatic retry with exponential backoff
   - Network error detection
   - Timeout handling

## Best Practices

1. **Always use `handleError()` for error processing**
   ```typescript
   catch (error) {
     handleError(error, { showToast: true, translate, toast })
   }
   ```

2. **Use safe utilities for risky operations**
   ```typescript
   const data = safeLocalStorageGet('key', defaultValue)
   ```

3. **Provide fallback messages**
   ```typescript
   handleError(error, {
     fallbackMessage: { fr: "Error", ar: "خطأ" }
   })
   ```

4. **Don't show toasts for background operations**
   ```typescript
   handleError(error, { showToast: false })
   ```

5. **Use appropriate error types**
   ```typescript
   throw new ValidationError('Invalid input', 'fieldName')
   ```

## Testing

Error handling is tested in:
- `__tests__/utils/*.test.ts` - Utility error handling tests
- Error scenarios are covered in all test suites

## Future Enhancements

- [ ] Error reporting service integration (Sentry, etc.)
- [ ] Error analytics and monitoring
- [ ] User error feedback collection
- [ ] Automatic error recovery mechanisms
- [ ] Offline error queue for retry when online

