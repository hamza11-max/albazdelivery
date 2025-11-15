# @albaz/shared

Shared utilities, types, and helper functions for the AL-baz Delivery Platform.

## Usage

```typescript
import { formatPrice } from '@albaz/shared/utils'
import type { Order, User } from '@albaz/shared/types'
```

## TypeScript Configuration

This package has its own isolated TypeScript configuration. If you see IDE errors about `testing-library__jest-dom`, this is a known IDE issue and doesn't affect the actual TypeScript compilation. The package's `tsconfig.json` explicitly excludes test-related types with `"types": []`.

To verify the package compiles correctly:
```bash
npm run type-check
```

