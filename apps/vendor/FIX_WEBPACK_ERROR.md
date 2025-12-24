# Fix Webpack Module Resolution Error

## Problem
The error `Cannot read properties of undefined (reading 'call')` is a webpack module resolution issue, typically caused by:
1. Stale Next.js cache
2. Module import/export mismatch
3. Circular dependencies

## Solution

### Step 1: Clear Next.js Cache
```bash
cd apps/vendor
rm -rf .next
# Or on Windows PowerShell:
Remove-Item -Recurse -Force .next
```

### Step 2: Restart Dev Server
```bash
npm run dev
```

## What Was Fixed

1. **Import Paths**: Changed from mixed absolute/relative to consistent relative paths:
   ```typescript
   // Before (causing issues):
   import { StaffLoginScreen, type StaffUser } from "../../components/StaffLoginScreen"
   
   // After (fixed):
   import { StaffLoginScreen } from "../../components/StaffLoginScreen"
   import type { StaffUser } from "../../components/StaffLoginScreen"
   ```

2. **Type Imports**: Separated type imports from value imports to avoid webpack resolution issues.

## If Error Persists

1. **Clear node_modules cache**:
   ```bash
   rm -rf node_modules/.cache
   ```

2. **Restart the dev server completely**:
   - Stop the current dev server (Ctrl+C)
   - Clear `.next` folder
   - Run `npm run dev` again

3. **Check for circular dependencies**:
   - Ensure `StaffLoginScreen` and `VendorHeader` don't import from each other
   - Verify all exports are correct

## Verification

After clearing cache, the app should:
- ✅ Load without webpack errors
- ✅ Show staff login screen after vendor authentication
- ✅ Display header with current staff info
- ✅ Filter sales by current staff

---

**Status**: Import paths fixed. Clear cache and restart dev server.

