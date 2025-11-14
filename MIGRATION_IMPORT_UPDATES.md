# Import Migration Guide

## Import Changes Required

All imports in the migrated apps need to be updated from the old `@/` paths to the new `@albaz/*` package imports.

## Common Import Mappings

### UI Components
```typescript
// Before
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

// After
import { Button, Card, useToast } from "@albaz/ui"
```

### Types
```typescript
// Before
import type { Order } from "@/lib/types"
import type { User } from "@/lib/types"

// After
import type { Order, User } from "@albaz/shared/types"
// Or
import type { Order } from "@albaz/shared"
```

### Utilities
```typescript
// Before
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/utils"

// After
import { cn, formatPrice } from "@albaz/shared/utils"
// Or
import { cn, formatPrice } from "@albaz/shared"
```

### Authentication
```typescript
// Before
import { useAuth } from "@/hooks/use-auth"
import { authConfig } from "@/lib/auth.config"

// After
import { useAuth } from "@albaz/auth"
import { authConfig } from "@albaz/auth"
```

### Hooks (if not in packages)
```typescript
// Before
import { useSSE } from "@/lib/use-sse"

// After (keep in app or move to shared)
import { useSSE } from "@/lib/use-sse" // Still works with @/* paths within app
```

## Automated Update Script

You can use find/replace in your IDE:

1. Find: `from "@/components/ui/`
   Replace: `from "@albaz/ui"`

2. Find: `from "@/lib/types"`
   Replace: `from "@albaz/shared/types"`

3. Find: `from "@/lib/utils"`
   Replace: `from "@albaz/shared/utils"`

4. Find: `from "@/hooks/use-auth"`
   Replace: `from "@albaz/auth"`

## Files That Need Updates

### Customer App
- `apps/customer/app/page.tsx`
- `apps/customer/app/login/page.tsx`
- `apps/customer/app/signup/page.tsx`
- `apps/customer/app/checkout/page.tsx`
- `apps/customer/app/package-delivery/page.tsx`

### Vendor App
- `apps/vendor/app/vendor/page.tsx`
- `apps/vendor/app/vendor/fetch-data.ts`
- `apps/vendor/app/vendor/types.ts`
- All API routes in `apps/vendor/app/api/`

### Driver App
- `apps/driver/app/driver/page.tsx`
- All API routes in `apps/driver/app/api/`

### Admin App
- `apps/admin/app/admin/page.tsx`
- All API routes in `apps/admin/app/api/`

## Notes

- Some imports like `@/lib/prisma` should remain as `@/lib/prisma` since Prisma is app-specific
- API routes can still use `@/lib/*` for server-side code
- Client components should use `@albaz/*` packages
- Server components can use both depending on context

