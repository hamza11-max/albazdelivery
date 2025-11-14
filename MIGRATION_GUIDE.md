# Monorepo Migration Guide

## Current Status

✅ **Completed:**
- Turborepo setup
- Directory structure created (apps/ and packages/)
- Shared packages created (shared, ui, auth)
- Customer app structure created
- Vendor, Driver, Admin app structures created
- Root package.json updated for workspaces

## Next Steps

### 1. Complete File Migration

Move remaining files to their respective apps:

```powershell
# Customer App (already started)
# Copy remaining customer-specific files

# Vendor App
Copy-Item -Path app/vendor -Destination apps/vendor/app/vendor -Recurse
Copy-Item -Path app/api/vendors -Destination apps/vendor/app/api/vendors -Recurse
Copy-Item -Path app/api/erp -Destination apps/vendor/app/api/erp -Recurse

# Driver App
Copy-Item -Path app/driver -Destination apps/driver/app/driver -Recurse
Copy-Item -Path app/api/driver -Destination apps/driver/app/api/driver -Recurse
Copy-Item -Path app/api/drivers -Destination apps/driver/app/api/drivers -Recurse
Copy-Item -Path app/api/delivery -Destination apps/driver/app/api/delivery -Recurse

# Admin App
Copy-Item -Path app/admin -Destination apps/admin/app/admin -Recurse
Copy-Item -Path app/api/admin -Destination apps/admin/app/api/admin -Recurse
```

### 2. Shared API Routes

Keep shared API routes in a common location or duplicate them:
- `/api/auth` - Shared across all apps
- `/api/orders` - Shared but may need app-specific versions
- `/api/health` - Shared

### 3. Update Imports

Replace all imports in moved files:

**Before:**
```typescript
import { Button } from "@/components/ui/button"
import type { Order } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
```

**After:**
```typescript
import { Button } from "@albaz/ui"
import type { Order } from "@albaz/shared/types"
import { useAuth } from "@albaz/auth"
```

### 4. Update tsconfig.json for Each App

Each app needs its own tsconfig.json with proper path mappings.

### 5. Update next.config.mjs

Each app needs its own next.config.mjs with:
- `transpilePackages: ['@albaz/shared', '@albaz/ui', '@albaz/auth']`
- App-specific configurations

### 6. Install Dependencies

```bash
npm install
```

This will install all workspace dependencies.

### 7. Test Each App

```bash
# Test customer app
cd apps/customer
npm run dev

# Test vendor app
cd apps/vendor
npm run dev

# Test driver app
cd apps/driver
npm run dev

# Test admin app
cd apps/admin
npm run dev
```

### 8. Update Build Scripts

The root `vercel-build.js` script needs to be updated to build the correct app based on deployment context.

## Benefits After Migration

1. **Independent Deployments** - Each app can be deployed separately
2. **Smaller Bundles** - Each app only includes what it needs
3. **Better Performance** - Faster initial loads
4. **Clear Boundaries** - Easier to maintain and debug
5. **Team Scalability** - Different teams can work on different apps

## Rollback Plan

If issues arise, you can:
1. Keep the original `app/` directory structure
2. Use the new structure alongside the old one
3. Gradually migrate one app at a time

## Notes

- The `lib/` directory will remain at the root for shared server-side code
- The `components/` directory structure may need to be reorganized
- API routes may need to be duplicated or shared via a separate service

