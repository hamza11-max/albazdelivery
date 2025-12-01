# Build Fix: Missing Hooks and Incorrect Import Paths

**Issue**: Build failing due to missing hooks and incorrect import paths  
**Status**: ✅ Fixed - All files copied and paths corrected

---

## 🔧 **Problem**

The build was failing with multiple module resolution errors:
1. `Module not found: Can't resolve '../../hooks/use-orders-query'` in `MyOrdersView.tsx` and `TrackingView.tsx`
2. `Module not found: Can't resolve './use-websocket'` in `use-realtime-updates.ts`
3. `Module not found: Can't resolve '../../../admin/lib/csrf'` in `app/api/admin/users/bulk/route.ts`
4. `Module not found: Can't resolve '../../../admin/lib/audit'` in `app/api/admin/users/bulk/route.ts`

---

## ✅ **Solution**

### **1. Copied Missing Hooks**

- ✅ `use-orders-query.ts` → `hooks/use-orders-query.ts`
- ✅ `use-websocket.ts` → `hooks/use-websocket.ts`

### **2. Fixed Import Path in Bulk Route**

**File**: `app/api/admin/users/bulk/route.ts`

**Path Calculation**:
- File location: `app/api/admin/users/bulk/route.ts`
- Target: `app/admin/lib/csrf.ts`
- From `bulk/` directory:
  - Up 1: `users/`
  - Up 2: `admin/`
  - Up 3: `api/`
  - Up 4: `app/`
  - Then: `admin/lib/csrf`

**Before** (incorrect):
```typescript
import { csrfProtection } from '../../../admin/lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '../../../admin/lib/audit'
```

**After** (correct):
```typescript
import { csrfProtection } from '../../../../admin/lib/csrf'
import { createAuditLog, AuditActions, AuditResources } from '../../../../admin/lib/audit'
```

---

## 📋 **Files Modified/Copied**

| File | Action | Status |
|------|--------|--------|
| `hooks/use-orders-query.ts` | Copied from `apps/customer/hooks/` | ✅ |
| `hooks/use-websocket.ts` | Copied from `apps/customer/hooks/` | ✅ |
| `app/api/admin/users/bulk/route.ts` | Fixed import paths (3 → 4 levels up) | ✅ |

---

## ✅ **Verification**

All files verified:
- ✅ `hooks/use-orders-query.ts` exists
- ✅ `hooks/use-websocket.ts` exists
- ✅ `app/api/admin/users/bulk/route.ts` has correct paths

---

## 🚀 **Next Steps**

1. **Verify changes**:
   ```powershell
   git status
   git diff hooks/ app/api/admin/users/bulk/route.ts
   ```

2. **Commit the fix**:
   ```powershell
   git add hooks/ app/api/admin/users/bulk/route.ts
   git commit -m "fix: Copy missing hooks and fix bulk route import paths"
   ```

3. **Push to trigger new build**:
   ```powershell
   git push origin main
   ```

4. **Monitor Vercel build** - It should now succeed! ✅

---

## 📝 **Summary**

- **Hooks Copied**: 2 files
- **Import Paths Fixed**: 2 paths in 1 file
- **Total Changes**: 3 files
- **Status**: ✅ Ready for commit and push

---

**The build should now succeed once these changes are committed and pushed!** 🎉

