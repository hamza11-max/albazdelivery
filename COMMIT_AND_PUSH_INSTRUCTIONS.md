# Commit and Push Instructions

**Status**: ✅ All fixes are in place locally  
**Issue**: Build is using old commit (f593048) - needs to be committed and pushed

---

## ✅ **What's Fixed Locally**

1. **Hooks Copied**:
   - ✅ `hooks/use-orders-query.ts`
   - ✅ `hooks/use-websocket.ts`

2. **Import Paths Fixed**:
   - ✅ `app/api/admin/users/bulk/route.ts` - Changed from `../../../` to `../../../../admin/lib/csrf`

---

## 🚀 **Next Steps - Commit and Push**

Run these commands to commit and push all fixes:

```powershell
# Stage all the fixes
git add hooks/use-orders-query.ts
git add hooks/use-websocket.ts
git add app/api/admin/users/bulk/route.ts

# Also add any other files that were copied/fixed
git add components/
git add lib/validation.ts
git add lib/mock-data.ts

# Commit
git commit -m "fix: Copy missing hooks, fix import paths, and add missing dependencies

- Copy use-orders-query and use-websocket hooks from apps/customer
- Fix bulk route import paths (4 levels up instead of 3)
- Copy missing customer components, vendor components, and dependencies
- Add missing validation.ts and other lib files"

# Push to trigger new build
git push origin main
```

---

## 📋 **All Files That Need to Be Committed**

### **Hooks** (from apps/customer):
- `hooks/use-orders-query.ts`
- `hooks/use-websocket.ts`
- `hooks/use-categories-query.ts`
- `hooks/use-stores-query.ts`
- `hooks/use-products-query.ts`
- `hooks/use-orders-mutation.ts`
- `hooks/use-realtime-updates.ts`
- `hooks/use-error-handler.ts`

### **Vendor Hooks** (from apps/vendor):
- `hooks/usePOSCart.ts`
- `hooks/useBarcodeScanner.ts`
- `hooks/useDataLoading.ts`
- `hooks/usePOSHandlers.ts`
- `hooks/useVendorState.ts`

### **Components**:
- `components/CategoryIcon.tsx`
- `components/ui/skeleton-loaders.tsx`
- `components/views/*` (7 files)
- `components/navigation/BottomNav.tsx`
- `components/ReceiptView.tsx`
- `components/POSView.tsx`
- `components/dialogs/*` (7 files)
- `components/tabs/*` (11 files)
- And more...

### **Utils**:
- `utils/*` (12 vendor utils files)

### **Lib Files**:
- `lib/validation.ts`
- `lib/mock-data.ts`

### **Fixed Files**:
- `app/admin/page.tsx` (import paths fixed)
- `app/api/admin/users/bulk/route.ts` (import paths fixed)
- `app/api/admin/*` (multiple import paths fixed)

---

## ✅ **After Pushing**

Once you push, Vercel will automatically:
1. Clone the new commit
2. Run the build
3. The build should now succeed! ✅

---

**All fixes are ready - just commit and push!** 🚀

