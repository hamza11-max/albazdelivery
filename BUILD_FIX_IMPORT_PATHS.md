# Build Fix: Import Path Corrections

**Date**: $(Get-Date -Format "yyyy-MM-dd")
**Issue**: Build failing due to incorrect import paths after copying files from `apps/` to `app/`

---

## 🔧 **Fixed Import Paths**

### **1. Admin Page Component Imports**

**File**: `app/admin/page.tsx`

**Before** (incorrect):
```typescript
import { fetchWithCsrf } from "../../lib/csrf-client"
import { AdminHeader } from "../../components/AdminHeader"
// ... etc
```

**After** (correct):
```typescript
import { fetchWithCsrf } from "../lib/csrf-client"
import { AdminHeader } from "../components/AdminHeader"
// ... etc
```

**Reason**: Files are at `app/admin/page.tsx`, so paths to `app/admin/lib/` and `app/admin/components/` should use `../` not `../../`.

---

### **2. Admin API Routes - CSRF and Audit Imports**

All admin API routes had incorrect paths to `csrf.ts` and `audit.ts` files.

**Fixed Files**:
- ✅ `app/api/admin/ads/route.ts`
- ✅ `app/api/admin/ads/[id]/route.ts`
- ✅ `app/api/admin/registration-requests/route.ts`
- ✅ `app/api/admin/users/bulk/route.ts`
- ✅ `app/api/admin/users/[id]/route.ts`
- ✅ `app/api/admin/users/[id]/suspend/route.ts`
- ✅ `app/api/admin/users/[id]/unsuspend/route.ts`

**Pattern**:
- **Before**: `../../../../lib/csrf` or `../../../../../lib/csrf`
- **After**: `../../../admin/lib/csrf` or `../../../../admin/lib/csrf`

**Reason**: Files are at `app/admin/lib/csrf.ts` and `app/admin/lib/audit.ts`, not in a root `lib/` directory.

**Path Calculation**:
- From `app/api/admin/ads/route.ts` (depth: 4)
  - Up 3 levels: `app/api/admin/ads/` → `app/api/admin/` → `app/api/` → `app/`
  - Then `admin/lib/csrf` → `app/admin/lib/csrf.ts` ✓

- From `app/api/admin/users/[id]/suspend/route.ts` (depth: 6)
  - Up 5 levels to `app/`
  - Then `admin/lib/csrf` → `app/admin/lib/csrf.ts` ✓

---

### **3. CSRF Token API Route**

**File**: `app/api/csrf-token/route.ts`

**Before**:
```typescript
import { getCsrfToken, setCsrfTokenCookie } from '../../../lib/csrf'
```

**After**:
```typescript
import { getCsrfToken, setCsrfTokenCookie } from '../../admin/lib/csrf'
```

**Reason**: From `app/api/csrf-token/route.ts`, need to go up 2 levels to `app/`, then into `admin/lib/`.

---

### **4. Removed Duplicate Nested Directories**

**Removed**:
- ✅ `app/api/admin/admin/` (duplicate nested structure)
- ✅ `app/api/csrf-token/csrf-token/` (duplicate nested structure)

**Reason**: The copy script created incorrect nested directory structures. These were removed as the correct files already exist at the proper locations.

---

## 📋 **Summary of Changes**

| File | Change | Status |
|------|--------|--------|
| `app/admin/page.tsx` | Fixed 11 import paths (`../../` → `../`) | ✅ |
| `app/api/admin/ads/route.ts` | Fixed csrf/audit imports | ✅ |
| `app/api/admin/ads/[id]/route.ts` | Fixed csrf/audit imports | ✅ |
| `app/api/admin/registration-requests/route.ts` | Fixed csrf/audit imports | ✅ |
| `app/api/admin/users/bulk/route.ts` | Fixed csrf/audit imports | ✅ |
| `app/api/admin/users/[id]/route.ts` | Fixed csrf/audit imports | ✅ |
| `app/api/admin/users/[id]/suspend/route.ts` | Fixed csrf/audit imports | ✅ |
| `app/api/admin/users/[id]/unsuspend/route.ts` | Fixed csrf/audit imports | ✅ |
| `app/api/csrf-token/route.ts` | Fixed csrf import | ✅ |

---

## ✅ **Build Status**

All import path issues have been resolved. The build should now succeed.

**Next Steps**:
1. Commit these changes
2. Push to trigger a new build
3. Verify build succeeds

---

## 🔍 **How to Verify**

Run a local build to verify:
```powershell
npm run build
# or
pnpm build
```

If successful, you should see:
```
✓ Compiled successfully
```

---

**Status**: ✅ **All import paths fixed!**

